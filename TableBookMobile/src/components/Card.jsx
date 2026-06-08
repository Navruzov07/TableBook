import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';

export default function Card({ restaurant, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image 
        source={{ uri: restaurant.photo || 'https://via.placeholder.com/150' }} 
        style={styles.image} 
      />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
          <Text style={styles.rating}>⭐ {restaurant.rating || 'N/A'}</Text>
        </View>
        <Text style={styles.category}>{restaurant.category}</Text>
        <Text style={styles.hours}>🕒 {restaurant.hours || '09:00 - 23:00'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  rating: {
    fontSize: 14,
    color: COLORS.text,
  },
  category: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 4,
  },
  hours: {
    fontSize: 12,
    color: COLORS.muted,
  }
});
