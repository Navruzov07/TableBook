import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyBookings, cancelBooking } from '../../services/api';
import Button from '../../components/Button';
import { COLORS } from '../../constants/colors';
import { t } from '../../i18n';

export default function BookingDetails() {
  const { id } = useLocalSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const res = await getMyBookings();
      const b = res.data.find(x => x._id === id);
      setBooking(b);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelBooking(id);
      router.back();
    } catch (e) {
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></SafeAreaView>;
  if (!booking) return <SafeAreaView style={styles.center}><Text style={styles.text}>Not found</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Booking at {booking.restaurant?.name}</Text>
        <View style={[styles.badge, styles[`badge_${booking.status}`]]}>
          <Text style={styles.badgeText}>
            {booking.status === 'confirmed' ? t('status_confirmed') : 
             booking.status === 'cancelled' ? t('status_cancelled') : t('status_pending')}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Date & Time</Text>
          <Text style={styles.value}>{booking.date} at {booking.time}</Text>

          <Text style={styles.label}>Table</Text>
          <Text style={styles.value}>{booking.table?.name}</Text>

          <Text style={styles.label}>Guests</Text>
          <Text style={styles.value}>{booking.guestCount}</Text>

          {booking.specialRequests ? (
            <>
              <Text style={styles.label}>Special Requests</Text>
              <Text style={styles.value}>{booking.specialRequests}</Text>
            </>
          ) : null}
        </View>

        {booking.preOrderedItems?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pre-ordered Items</Text>
            {booking.preOrderedItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.menuItem?.name || 'Item'}</Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
              </View>
            ))}
          </View>
        )}

        {booking.status !== 'cancelled' && new Date(`${booking.date}T${booking.time}`) > new Date() && (
          <Button 
            title={t('cancel_booking')} 
            variant="outline" 
            onPress={handleCancel} 
            loading={cancelling}
            style={styles.cancelBtn} 
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.darkBg },
  text: { color: COLORS.text },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 20 },
  badge_confirmed: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  badge_pending: { backgroundColor: 'rgba(234, 179, 8, 0.2)' },
  badge_cancelled: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  badgeText: { color: COLORS.text, fontWeight: 'bold' },
  card: { backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  label: { color: COLORS.muted, fontSize: 12, marginBottom: 4, marginTop: 12 },
  value: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { color: COLORS.text, fontSize: 16 },
  itemQty: { color: COLORS.muted, fontSize: 16 },
  cancelBtn: { marginTop: 20, borderColor: 'red' }
});
