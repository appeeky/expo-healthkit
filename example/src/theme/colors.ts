import { Platform } from 'react-native';
import { Color } from 'expo-router';

export const colors = {
  label: Platform.select({
    ios: Color.ios.label,
    android: Color.android.dynamic.onSurface,
    default: '#000000',
  })!,
  secondaryLabel: Platform.select({
    ios: Color.ios.secondaryLabel,
    android: Color.android.dynamic.onSurfaceVariant,
    default: '#8E8E93',
  })!,
  systemBackground: Platform.select({
    ios: Color.ios.systemBackground,
    android: Color.android.dynamic.surface,
    default: '#FFFFFF',
  })!,
  secondarySystemBackground: Platform.select({
    ios: Color.ios.secondarySystemBackground,
    android: Color.android.dynamic.surfaceContainer,
    default: '#F2F2F7',
  })!,
  systemBlue: Platform.select({
    ios: Color.ios.systemBlue,
    android: Color.android.dynamic.primary,
    default: '#007AFF',
  })!,
  systemOrange: Platform.select({
    ios: Color.ios.systemOrange,
    android: Color.android.dynamic.tertiary,
    default: '#FF9500',
  })!,
  systemRed: Platform.select({
    ios: Color.ios.systemRed,
    android: Color.android.dynamic.error,
    default: '#FF2D55',
  })!,
  systemPurple: Platform.select({
    ios: Color.ios.systemPurple,
    android: Color.android.dynamic.tertiary,
    default: '#AF52DE',
  })!,
  systemTeal: Platform.select({
    ios: Color.ios.systemTeal,
    android: Color.android.dynamic.secondary,
    default: '#5AC8FA',
  })!,
  systemGreen: Platform.select({
    ios: Color.ios.systemGreen,
    android: Color.android.dynamic.primary,
    default: '#34C759',
  })!,
  systemPink: Platform.select({
    ios: Color.ios.systemPink,
    android: Color.android.dynamic.error,
    default: '#FF2D55',
  })!,
  systemFill: Platform.select({
    ios: Color.ios.secondarySystemFill,
    android: Color.android.dynamic.surfaceContainerHigh,
    default: '#E5E5EA',
  })!,
  peach: '#F4C7B0',
  peachSoft: '#F8D9C8',
  avatar: '#7CB8F0',
  orangeMuted: '#F4A266',
};
