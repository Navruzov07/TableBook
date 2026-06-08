import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useStore } from '../store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const { token, loadSettings } = useStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    // We delay the redirect slightly to allow initial render.
    // In a real app we might have a distinct 'isReady' state.
    if (token === null && !inAuthGroup) {
      router.replace('/login');
    } else if (token !== null && inAuthGroup) {
      router.replace('/home');
    }
  }, [token, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0a1a12' }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a1a12' } }} />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
