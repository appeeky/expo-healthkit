import { ScrollView, Text, View } from 'react-native';

import { CollapsingHeader, useCollapsingScroll, useSafeScrollPadding } from '@/src/collapsing-header';
import { HealthScreen } from '@/src/health-hero-gradient';
import { MetricCard } from '@/src/metric-card';
import { colors } from '@/src/theme/colors';
import { isTodayMetric, useHealthSnapshot } from '@/src/use-health-data';

export default function AllDataScreen() {
  const { metrics, error } = useHealthSnapshot();
  const { scrollY, onScroll } = useCollapsingScroll();
  const scrollPadding = useSafeScrollPadding();
  const today = metrics.filter(isTodayMetric);
  const older = metrics.filter((metric) => !isTodayMetric(metric));

  return (
    <HealthScreen>
      <ScrollView
        onScroll={onScroll}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, gap: 12, ...scrollPadding }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <Text style={{ fontSize: 34, fontWeight: '700', color: colors.label, letterSpacing: 0.3 }}>
          All Health Data
        </Text>
        {error ? (
          <Text selectable style={{ color: colors.systemRed, fontSize: 15, lineHeight: 20 }}>
            {error}
          </Text>
        ) : null}
        {today.length ? (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.label }}>Today</Text>
            {today.map(({ key, ...metric }) => (
              <MetricCard key={key} {...metric} />
            ))}
          </View>
        ) : null}
        {older.length ? (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.label }}>Older</Text>
            {older.map(({ key, ...metric }) => (
              <MetricCard key={key} {...metric} />
            ))}
          </View>
        ) : null}
      </ScrollView>
      <CollapsingHeader title="All Health Data" scrollY={scrollY} />
    </HealthScreen>
  );
}
