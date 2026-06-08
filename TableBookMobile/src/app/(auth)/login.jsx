import { useState, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS } from '../../constants/colors';
import { t } from '../../i18n';
import { sendOTP, verifyOTP } from '../../services/api';
import { useStore } from '../../store';

export default function Login() {
  const [phone, setPhone] = useState('+998');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useStore(state => state.setAuth);
  
  const otpRefs = useRef([]);

  const handleSendCode = async () => {
    if (phone.length < 13) return;
    setLoading(true);
    try {
      await sendOTP(phone);
      setStep(2);
    } catch (e) {
      // Error handled in interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return;
    setLoading(true);
    try {
      const res = await verifyOTP(phone, code);
      const { token, user } = res.data;
      await AsyncStorage.setItem('jwt', token);
      setAuth(token, user);
      router.replace('/home');
    } catch (e) {
      // Error handled
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, index) => {
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>TableBook</Text>
        
        {step === 1 ? (
          <View style={styles.form}>
            <Input 
              label={t('login_phone')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={13}
            />
            <Button 
              title={t('login_send_code')} 
              onPress={handleSendCode} 
              loading={loading}
              disabled={phone.length < 13}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.subtitle}>Enter code sent to {phone}</Text>
            <View style={styles.otpContainer}>
              {otp.map((digit, i) => (
                <Input 
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(val, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={styles.otpInput}
                />
              ))}
            </View>
            <Button 
              title={t('login_verify')} 
              onPress={handleVerify} 
              loading={loading}
              disabled={otp.join('').length < 6}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.darkBg },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 40,
  },
  subtitle: {
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 45,
    textAlign: 'center',
    fontSize: 20,
    padding: 10,
  }
});
