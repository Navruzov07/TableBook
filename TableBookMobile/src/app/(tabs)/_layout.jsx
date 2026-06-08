import { Tabs as ExpoTabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useStore } from '../../store';
import { t } from '../../i18n';

export default function TabLayout() {
  const { user } = useStore();

  return (
    <ExpoTabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: COLORS.cardBg,
        borderTopColor: COLORS.border,
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.muted,
    }}>
      <ExpoTabs.Screen 
        name="home" 
        options={{
          title: t('home_title'),
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />
        }} 
      />
      <ExpoTabs.Screen 
        name="search" 
        options={{
          title: t('search_title'),
          href: user?.role === 'ceo' || user?.role === 'admin' ? null : '/search', // Hide from CEO/admin
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />
        }} 
      />
      <ExpoTabs.Screen 
        name="profile" 
        options={{
          title: t('profile_title'),
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />
        }} 
      />
    </ExpoTabs>
  );
}

// Simple placeholder icon renderer since we might not have vector icons configured properly
function TabBarIcon({ name, color }) {
  return <FontAwesome name={name} size={24} color={color} />;
}
