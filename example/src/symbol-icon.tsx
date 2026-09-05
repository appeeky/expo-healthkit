import { SymbolView } from 'expo-symbols';
import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

const ANDROID_SYMBOLS: Record<string, AndroidSymbol> = {
  'heart.fill': 'favorite',
  ear: 'hearing',
  'flame.fill': 'local_fire_department',
  'figure.walk': 'directions_walk',
  'bed.double.fill': 'hotel',
  'figure.stand': 'accessibility_new',
  'arrow.left.arrow.right': 'swap_horiz',
  'figure.run': 'directions_run',
  'chevron.right': 'chevron_right',
  'checkmark.circle.fill': 'check_circle',
};

interface SymbolIconProps {
  name: string;
  size?: number;
  tint: ColorValue;
  style?: StyleProp<ViewStyle>;
}

export function SymbolIcon({ name, size = 18, tint, style }: SymbolIconProps) {
  const android = ANDROID_SYMBOLS[name] ?? 'circle';
  return (
    <SymbolView
      name={{ ios: name as SFSymbol, android, web: android }}
      size={size}
      tintColor={tint}
      type="monochrome"
      style={style}
    />
  );
}
