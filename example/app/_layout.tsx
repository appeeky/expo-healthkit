import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DefaultTheme } from 'expo-router';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { PermissionProvider } from '@/src/permission-context';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider value={DefaultTheme}>
        <PermissionProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: 'default' }}>
            <Stack.Screen name="index" />
            <Stack.Screen
              name="(tabs)"
              options={{
                animation: 'default',
                gestureEnabled: false,
              }}
            />
          </Stack>
        </PermissionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
