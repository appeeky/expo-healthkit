import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CollapsingHeader, useCollapsingScroll, useSafeScrollPadding } from '@/src/collapsing-header';
import { HealthScreen } from '@/src/health-hero-gradient';
import { MetricCard } from '@/src/metric-card';
import { ProfileAvatar } from '@/src/profile-avatar';
import { requestHealthAccess } from '@/src/health';
import { usePermissionSheet } from '@/src/permission-context';
import { SymbolIcon } from '@/src/symbol-icon';
import { colors } from '@/src/theme/colors';
import { useHealthSnapshot } from '@/src/use-health-data';

export default function SummaryScreen() {
  const { bumpAuth } = usePermissionSheet();
  const { metrics, error } = useHealthSnapshot();
  const { scrollY, onScroll } = useCollapsingScroll();
  const scrollPadding = useSafeScrollPadding();

  return (
    <HealthScreen>
      <ScrollView
        onScroll={onScroll}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 21, paddingBottom: 28, gap: 12, ...scrollPadding }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            style={{
              flex: 1,
              fontSize: 34,
              fontWeight: '700',
              color: colors.label,
              letterSpacing: 0.3,
            }}
          >
            Summary
          </Text>
          <ProfileAvatar />
        </View>

        {error ? (
          <Text selectable style={{ color: colors.systemRed, fontSize: 15, lineHeight: 20 }}>
            {error}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.label }}>Pinned</Text>
          <Pressable
            onPress={() => {
              void requestHealthAccess()
                .then(() => bumpAuth())
                .catch(() => { });
            }}
          >
            <Text style={{ color: colors.systemBlue, fontSize: 17 }}>Edit</Text>
          </Pressable>
        </View>

        {metrics.map(({ key, ...metric }) => (
          <MetricCard key={key} {...metric} />
        ))}

        <Pressable
          onPress={() => router.push('/(tabs)/(summary)/all-data')}
          style={{
            backgroundColor: colors.systemBackground,
            borderRadius: 16,
            borderCurve: 'continuous',
            paddingHorizontal: 16,
            minHeight: 52,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <SymbolIcon name="heart.fill" size={20} tint={colors.systemRed} />
          <Text style={{ flex: 1, fontSize: 17, fontWeight: '500', color: colors.label }}>
            Show All Health Data
          </Text>
          <Text style={{ color: colors.secondaryLabel, fontSize: 22 }}>›</Text>
        </Pressable>
      </ScrollView>
      <CollapsingHeader title="Summary" scrollY={scrollY} />
    </HealthScreen>
  );
}
