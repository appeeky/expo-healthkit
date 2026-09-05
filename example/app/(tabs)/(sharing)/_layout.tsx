import { Stack } from 'expo-router/stack';

import { colors } from '@/src/theme/colors';

export default function SharingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitle: false,
        headerTintColor: colors.label,
        contentStyle: { backgroundColor: colors.secondarySystemBackground },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
