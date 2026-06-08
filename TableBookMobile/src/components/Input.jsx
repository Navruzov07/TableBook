import { forwardRef } from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../constants/colors';

const Input = forwardRef(({ label, error, style, ...props }, ref) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput 
        ref={ref}
        style={[styles.input, error && styles.inputError, style]} 
        placeholderTextColor={COLORS.muted}
        {...props} 
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

export default Input;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  }
});
