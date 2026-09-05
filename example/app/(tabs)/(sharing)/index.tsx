import { ScrollView, Text, View } from 'react-native';

import { CollapsingHeader, useCollapsingScroll, useSafeScrollPadding } from '@/src/collapsing-header';
import { HealthScreen } from '@/src/health-hero-gradient';
import { colors } from '@/src/theme/colors';

export default function SharingScreen() {
  const { scrollY, onScroll } = useCollapsingScroll();
  const scrollPadding = useSafeScrollPadding();

  return (
    <HealthScreen>
      <ScrollView
        onScroll={onScroll}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, gap: 12, ...scrollPadding }}
        scrollEventThrottle={16}
      >
        <Text style={{ fontSize: 34, fontWeight: '700', color: colors.label, letterSpacing: 0.3 }}>
          Sharing
        </Text>
        <View
          style={{
            backgroundColor: colors.systemBackground,
            borderRadius: 16,
            borderCurve: 'continuous',
            padding: 24,
            gap: 8,
          }}
        >
          <Text style={{ color: colors.secondaryLabel, fontSize: 16, lineHeight: 22 }}>
            Trend sharing is not part of this example. Use Summary to read live HealthKit data.
          </Text>
        </View>
      </ScrollView>
      <CollapsingHeader title="Sharing" scrollY={scrollY} />
    </HealthScreen>
  );
}
