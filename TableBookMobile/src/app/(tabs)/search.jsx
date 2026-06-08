import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { getRestaurants } from '../../services/api';
import { COLORS } from '../../constants/colors';
import { t } from '../../i18n';

const CATEGORIES = ['All', 'Fine Dining', 'European', 'National', 'Fast Food'];

export default function Search() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getRestaurants();
      setRestaurants(res.data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const filteredData = restaurants.filter(r => {
    const matchesQuery = r.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'All' || r.category === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Input 
          placeholder={t('search_placeholder')}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        <View style={styles.chipsRow}>
          <FlatList 
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.chip, category === item && styles.chipActive]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.chipText, category === item && styles.chipTextActive]}>
                  {item === 'All' ? t('filter_all') : item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t('empty_search')}</Text>
          }
          renderItem={({ item }) => (
            <Card restaurant={item} onPress={() => router.push(`/restaurant/${item._id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBg },
  header: { padding: 16 },
  chipsRow: { marginTop: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 14,
  },
  chipTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  list: { padding: 16 },
  emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 50, fontSize: 16 }
});
