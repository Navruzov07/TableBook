import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getMyBookings } from '../../services/api';
import Button from '../../components/Button';
import { COLORS } from '../../constants/colors';
import { useStore } from '../../store';
import { t } from '../../i18n';

export default function Profile() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout, language, setLanguage } = useStore();
  const router = useRouter();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await getMyBookings();
      setBookings(res.data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (phone) => {
    if (!phone) return 'U';
    return phone.slice(-2);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const renderBooking = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => router.push(`/booking/${item._id}`)}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.restaurantName}>{item.restaurant?.name || 'Restaurant'}</Text>
        <View style={[styles.badge, styles[`badge_${item.status}`]]}>
          <Text style={styles.badgeText}>
            {item.status === 'confirmed' ? t('status_confirmed') : 
             item.status === 'cancelled' ? t('status_cancelled') : t('status_pending')}
          </Text>
        </View>
      </View>
      <Text style={styles.bookingDetails}>{item.date} at {item.time}</Text>
      <Text style={styles.bookingDetails}>Table {item.table?.name} • {item.guestCount} guests</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.phone)}</Text>
        </View>
        <Text style={styles.phone}>{user?.phone || '+998 XX XXX XX XX'}</Text>
      </View>

      <View style={styles.settings}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.langRow}>
          {['EN', 'RU', 'UZ'].map(l => (
            <TouchableOpacity 
              key={l}
              style={[styles.langBtn, language === l && styles.langBtnActive]}
              onPress={() => setLanguage(l)}
            >
              <Text style={[styles.langText, language === l && styles.langTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bookingsSection}>
        <Text style={styles.sectionTitle}>My Bookings</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={item => item._id}
            renderItem={renderBooking}
            ListEmptyComponent={<Text style={styles.emptyText}>No bookings found.</Text>}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Button title={t('logout')} variant="outline" onPress={handleLogout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBg },
  header: { alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#000' },
  phone: { fontSize: 18, color: COLORS.text, fontWeight: 'bold' },
  settings: { padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  langBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  langText: { color: COLORS.text },
  langTextActive: { color: '#000', fontWeight: 'bold' },
  bookingsSection: { flex: 1, padding: 20 },
  bookingCard: { backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  restaurantName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badge_confirmed: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  badge_pending: { backgroundColor: 'rgba(234, 179, 8, 0.2)' },
  badge_cancelled: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  badgeText: { fontSize: 12, color: COLORS.text, fontWeight: 'bold' },
  bookingDetails: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
  emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 20 },
  footer: { padding: 20 }
});
