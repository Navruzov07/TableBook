import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        isPrimary ? styles.primary : styles.outline,
        (disabled || loading) && styles.disabled,
        style
      ]} 
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#000' : COLORS.primary} />
      ) : (
        <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textOutline]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  textPrimary: {
    color: '#000',
  },
  textOutline: {
    color: COLORS.primary,
  }
});
