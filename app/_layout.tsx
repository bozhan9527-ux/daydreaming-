import { Stack } from 'expo-router';

import { useOfflineProgress } from '../hooks/useOfflineProgress';

export default function RootLayout() {
  useOfflineProgress();
  return <Stack screenOptions={{ headerShown: false }} />;
}
