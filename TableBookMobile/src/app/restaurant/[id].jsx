import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { getRestaurantById, createBooking } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS } from '../../constants/colors';
import { t } from '../../i18n';
import { useStore } from '../../store';

export default function RestaurantDetails() {
  const { id } = useLocalSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Book');
  
  // Booking State
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [guestCount, setGuestCount] = useState('2');
  const [requests, setRequests] = useState('');
  const [preOrder, setPreOrder] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['50%', '80%'], []);
  const router = useRouter();
  const { user } = useStore();

  useEffect(() => {
    fetchRestaurant();
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const res = await getRestaurantById(id);
      setRestaurant(res.data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedTable) return;
    setSubmitting(true);
    try {
      const items = Object.values(preOrder).filter(i => i.qty > 0);
      await createBooking({
        restaurantId: id,
        tableId: selectedTable._id,
        date: date.toISOString().split('T')[0],
        time: "19:00", // Defaulting for simple demo
        guestCount: parseInt(guestCount, 10),
        specialRequests: requests,
        preOrderedItems: items.map(i => ({ menuItem: i._id, quantity: i.qty }))
      });
      bottomSheetRef.current?.close();
      router.push('/profile');
    } catch (e) {
    } finally {
      setSubmitting(false);
    }
  };

  const addToOrder = (item) => {
    setPreOrder(prev => ({
      ...prev,
      [item._id]: {
        ...item,
        qty: (prev[item._id]?.qty || 0) + 1
      }
    }));
  };

  const openBookingSheet = (table) => {
    if (table.isBooked) return;
    setSelectedTable(table);
    bottomSheetRef.current?.expand();
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></SafeAreaView>;
  if (!restaurant) return <SafeAreaView style={styles.center}><Text style={styles.text}>Not found</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <Image source={{ uri: restaurant.photo || 'https://via.placeholder.com/400' }} style={styles.hero} />
        
        <View style={styles.infoBox}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <Text style={styles.rating}>⭐ {restaurant.rating || 'N/A'}</Text>
        </View>

        <View style={styles.tabsRow}>
          {['Book', 'Menu', 'Info'].map(tab => {
            if (tab === 'Book' && user?.role === 'ceo') return null; // CEO can't book
            return (
              <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'Book' ? t('book_table') : tab === 'Menu' ? t('menu') : t('info')}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {activeTab === 'Book' && (
          <View style={styles.tabContent}>
            <Button title={`Date: ${date.toISOString().split('T')[0]}`} variant="outline" onPress={() => setShowDatePicker(true)} />
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(e, d) => {
                  setShowDatePicker(false);
                  if (d) setDate(d);
                }}
              />
            )}
            
            <View style={styles.floorMap}>
              {restaurant.tables?.map(table => (
                <TouchableOpacity 
                  key={table._id} 
                  style={[styles.tableCircle, { 
                    left: table.x || Math.random() * 200, 
                    top: table.y || Math.random() * 200,
                    backgroundColor: table.isBooked ? 'red' : COLORS.primary 
                  }]}
                  onPress={() => openBookingSheet(table)}
                >
                  <Text style={styles.tableText}>{table.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'Menu' && (
          <View style={styles.tabContent}>
            {restaurant.menu?.map(item => (
              <View key={item._id} style={styles.menuItem}>
                <Image source={{ uri: item.photo || 'https://via.placeholder.com/50' }} style={styles.menuImg} />
                <View style={styles.menuInfo}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  <Text style={styles.menuPrice}>${item.price}</Text>
                </View>
                <Button title={t('add')} onPress={() => addToOrder(item)} style={styles.addBtn} />
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Info' && (
          <View style={styles.tabContent}>
            <Text style={styles.text}>{restaurant.description}</Text>
            <Text style={styles.text}>{restaurant.address}</Text>
            <Text style={styles.text}>{restaurant.phone}</Text>
          </View>
        )}
      </ScrollView>

      {/* Booking Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: COLORS.cardBg }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Confirm Booking</Text>
          <Text style={styles.text}>Table: {selectedTable?.name}</Text>
          
          <Input 
            label={t('guest_count')}
            value={guestCount}
            onChangeText={setGuestCount}
            keyboardType="number-pad"
          />
          <Input 
            label={t('special_requests')}
            value={requests}
            onChangeText={setRequests}
            multiline
          />
          
          {Object.values(preOrder).filter(i => i.qty > 0).map(i => (
            <Text key={i._id} style={styles.text}>{i.name} x{i.qty}</Text>
          ))}

          <Button title={t('confirm_booking')} onPress={handleBook} loading={submitting} style={{ marginTop: 20 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.darkBg },
  text: { color: COLORS.text, marginBottom: 8 },
  hero: { width: '100%', height: 200 },
  infoBox: { padding: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  rating: { fontSize: 16, color: COLORS.primary, marginTop: 4 },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.muted, fontSize: 16 },
  tabTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  tabContent: { padding: 16 },
  floorMap: { height: 300, backgroundColor: COLORS.cardBg, marginTop: 16, borderRadius: 16, position: 'relative' },
  tableCircle: { position: 'absolute', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  tableText: { color: '#000', fontWeight: 'bold' },
  menuItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: COLORS.cardBg, padding: 10, borderRadius: 12 },
  menuImg: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
  menuInfo: { flex: 1 },
  menuName: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  menuPrice: { color: COLORS.muted, marginTop: 4 },
  addBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  sheetContent: { padding: 20 },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 }
});
