import { Stack } from 'expo-router/stack';

import { colors } from '@/src/theme/colors';

export default function SummaryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitle: false,
        headerTintColor: colors.label,
        headerBackButtonDisplayMode: 'minimal',
        animation: 'default',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        contentStyle: { backgroundColor: colors.secondarySystemBackground },
      }}
    >
      <Stack.Screen name="index" options={{ title: '' }} />
      <Stack.Screen name="all-data" options={{ title: '' }} />
    </Stack>
  );
}
