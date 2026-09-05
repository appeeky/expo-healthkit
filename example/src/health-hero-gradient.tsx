import { useWindowDimensions, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

const PAGE_BG = '#F2F2F6';

const heroLayers = [
  {
    type: 'radial-gradient' as const,
    shape: 'ellipse' as const,
    size: 'farthest-side' as const,
    position: { top: '-22%', left: '4%' },
    colorStops: [
      { color: 'rgba(244, 160, 124, 0.95)', positions: ['0%'] },
      { color: 'rgba(244, 160, 124, 0)', positions: ['68%'] },
    ],
  },
  {
    type: 'radial-gradient' as const,
    shape: 'ellipse' as const,
    size: 'farthest-side' as const,
    position: { top: '-18%', right: '-8%' },
    colorStops: [
      { color: 'rgba(110, 196, 176, 0.78)', positions: ['0%'] },
      { color: 'rgba(110, 196, 176, 0)', positions: ['64%'] },
    ],
  },
  {
    type: 'linear-gradient' as const,
    direction: 'to bottom',
    colorStops: [
      { color: 'rgba(248, 217, 200, 0.5)', positions: ['0%'] },
      { color: 'rgba(242, 242, 246, 0.2)', positions: ['58%'] },
      { color: 'rgba(242, 242, 246, 1)', positions: ['100%'] },
    ],
  },
];

export function HealthScreen({ children }: { children: ReactNode }) {
  const { height } = useWindowDimensions();
  const heroHeight = Math.round(Math.min(440, Math.max(300, height * 0.4)));
  const heroStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: heroHeight,
    experimental_backgroundImage: heroLayers,
  };

  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: PAGE_BG }}>
      <View pointerEvents="none" style={heroStyle} />
      {children}
    </View>
  );
}
