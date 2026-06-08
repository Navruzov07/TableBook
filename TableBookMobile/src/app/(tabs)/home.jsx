import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { getRestaurants } from '../../services/api';
import Card from '../../components/Card';
import { COLORS } from '../../constants/colors';
import { useStore } from '../../store';
import { t } from '../../i18n';

const { width, height } = Dimensions.get('window');

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const router = useRouter();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);
  const { language, setLanguage } = useStore();

  const fetchRestaurants = async () => {
    try {
      const res = await getRestaurants();
      setRestaurants(res.data);
    } catch (e) {
      // handled globally
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
  };

  useEffect(() => {
    fetchRestaurants();
    getLocation();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurants();
  };

  const toggleLanguage = () => {
    const nextLang = language === 'EN' ? 'RU' : language === 'RU' ? 'UZ' : 'EN';
    setLanguage(nextLang);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>TableBook</Text>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={styles.langText}>{language}</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 41.2995, // Tashkent default
          longitude: 69.2401,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {restaurants.map(r => (
          <Marker
            key={r._id}
            coordinate={{ latitude: r.location?.lat || 41.2995, longitude: r.location?.lng || 69.2401 }}
            title={r.name}
            description={r.category}
            onCalloutPress={() => router.push(`/restaurant/${r._id}`)}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerText}>{r.rating || '5.0'}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Bottom Sheet */}
      {user?.role === 'customer' || !user?.role ? (
        <BottomSheet
          ref={bottomSheetRef}
          index={1}
          snapPoints={snapPoints}
          backgroundStyle={{ backgroundColor: COLORS.darkBg }}
          handleIndicatorStyle={{ backgroundColor: COLORS.muted }}
        >
          <BottomSheetFlatList
            data={restaurants}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            renderItem={({ item }) => (
              <Card restaurant={item} onPress={() => router.push(`/restaurant/${item._id}`)} />
            )}
          />
        </BottomSheet>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  logo: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  langBtn: { padding: 8, backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  langText: { color: COLORS.text, fontWeight: 'bold' },
  map: { width, height },
  markerContainer: {
    backgroundColor: COLORS.primary,
    padding: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  markerText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  listContainer: { padding: 16 }
});
