import { Stack } from 'expo-router/stack';

import { colors } from '@/src/theme/colors';

export default function SearchLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: colors.label,
        contentStyle: { backgroundColor: colors.secondarySystemBackground },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
