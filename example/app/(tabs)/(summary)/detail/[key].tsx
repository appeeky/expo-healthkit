import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { CollapsingHeader, useCollapsingScroll, useSafeScrollPadding } from '@/src/collapsing-header';
import { HealthScreen } from '@/src/health-hero-gradient';
import { isBackgroundObserved, useBackgroundUpdates } from '@/src/background-sync';
import { DETAIL_RANGES, metricDetailConfig, useMetricDetail } from '@/src/metric-detail';
import type { DetailRange } from '@/src/metric-detail';
import { RangeChart } from '@/src/range-chart';
import { SymbolIcon } from '@/src/symbol-icon';
import { colors } from '@/src/theme/colors';

function formatValue(value: number, digits: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

function formatRange(from: Date, to: Date, range: DetailRange): string {
  const last = new Date(to.getTime() - 1);
  if (range === 'D') {
    return from.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }
  const sameYear = from.getFullYear() === last.getFullYear();
  const start = from.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: sameYear ? undefined : 'numeric' });
  const end = last.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} – ${end}`;
}

function formatSampleTime(date: Date): string {
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function MetricDetailScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const config = useMemo(() => metricDetailConfig(key ?? ''), [key]);
  const [range, setRange] = useState<DetailRange>('W');
  const data = useMetricDetail(config, range);
  const updates = useBackgroundUpdates(config?.type);
  const { scrollY, onScroll } = useCollapsingScroll();
  const scrollPadding = useSafeScrollPadding();

  if (!config) {
    return (
      <HealthScreen>
        <Text style={{ padding: 24, color: colors.secondaryLabel }}>Unknown metric “{key}”.</Text>
      </HealthScreen>
    );
  }

  const isDiscrete = config.aggregation === 'discrete';
  const showRange = isDiscrete && data.min != null && data.max != null && data.min !== data.max;

  return (
    <HealthScreen>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView
        onScroll={onScroll}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 16, ...scrollPadding }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <SymbolIcon name={config.symbol} size={22} tint={config.tint} />
          <Text style={{ fontSize: 34, fontWeight: '700', color: colors.label, letterSpacing: 0.3 }}>
            {config.title}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.systemFill,
            borderRadius: 10,
            padding: 2,
          }}
        >
          {DETAIL_RANGES.map((item) => {
            const isActive = item === range;
            return (
              <Pressable
                key={item}
                onPress={() => setRange(item)}
                style={{
                  flex: 1,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: isActive ? colors.systemBackground : 'transparent',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: isActive ? '600' : '500', color: colors.label }}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={{
            backgroundColor: colors.systemBackground,
            borderRadius: 24,
            borderCurve: 'continuous',
            padding: 18,
            gap: 14,
          }}
        >
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.secondaryLabel, letterSpacing: 0.4 }}>
              {showRange ? 'RANGE' : data.headlineLabel || ' '}
            </Text>
            <Text
              selectable
              style={{ fontSize: 32, fontWeight: '700', color: colors.label, fontVariant: ['tabular-nums'] }}
            >
              {data.isLoading && data.headline == null ? (
                <ActivityIndicator />
              ) : showRange ? (
                `${formatValue(data.min!, config.digits)}–${formatValue(data.max!, config.digits)}`
              ) : data.headline == null ? (
                'No Data'
              ) : (
                formatValue(data.headline, config.digits)
              )}
              {data.headline != null || showRange ? (
                <Text style={{ fontSize: 17, fontWeight: '400', color: colors.secondaryLabel }}>
                  {' '}
                  {config.unitLabel}
                </Text>
              ) : null}
            </Text>
            <Text style={{ fontSize: 15, color: colors.secondaryLabel }}>
              {formatRange(data.from, data.to, range)}
            </Text>
          </View>

          <RangeChart
            buckets={data.buckets}
            range={range}
            tint={config.tint}
            isDiscrete={isDiscrete}
            digits={config.digits}
          />

          {data.error ? (
            <Text selectable style={{ color: colors.systemRed, fontSize: 14, lineHeight: 19 }}>
              {data.error}
            </Text>
          ) : null}
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.label, paddingHorizontal: 4 }}>
            Recent Samples
          </Text>
          <View
            style={{
              backgroundColor: colors.systemBackground,
              borderRadius: 20,
              borderCurve: 'continuous',
              paddingHorizontal: 18,
            }}
          >
            {data.samples.length === 0 ? (
              <Text style={{ paddingVertical: 16, color: colors.secondaryLabel, fontSize: 15 }}>
                No samples in this range.
              </Text>
            ) : (
              data.samples.map((sample, index) => (
                <View
                  key={sample.uuid}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    gap: 12,
                    borderTopWidth: index === 0 ? 0 : 0.5,
                    borderTopColor: colors.systemFill,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 16, color: colors.label }}>{formatSampleTime(sample.endDate)}</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, color: colors.secondaryLabel }}>
                      {sample.sourceName ?? 'Unknown source'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: colors.label, fontVariant: ['tabular-nums'] }}>
                    {formatValue(sample.value, config.digits)}
                    <Text style={{ fontSize: 14, fontWeight: '400', color: colors.secondaryLabel }}>
                      {' '}
                      {config.unitLabel}
                    </Text>
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {isBackgroundObserved(config.type) ? (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.label, paddingHorizontal: 4 }}>
              Background Updates
            </Text>
            <View
              style={{
                backgroundColor: colors.systemBackground,
                borderRadius: 20,
                borderCurve: 'continuous',
                paddingHorizontal: 18,
              }}
            >
              {updates.length === 0 ? (
                <Text style={{ paddingVertical: 16, color: colors.secondaryLabel, fontSize: 15, lineHeight: 20 }}>
                  No deliveries since this process started. Kill the app, add a sample in Health, and
                  reopen: the wake-up is logged here and under the “expo-healthkit” subsystem in Console.
                </Text>
              ) : (
                updates.map((update, index) => (
                  <View
                    key={`${update.receivedAt.getTime()}-${index}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      gap: 12,
                      borderTopWidth: index === 0 ? 0 : 0.5,
                      borderTopColor: colors.systemFill,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 16, color: colors.label }}>{formatSampleTime(update.receivedAt)}</Text>
                      <Text style={{ fontSize: 13, color: colors.secondaryLabel }}>{update.summary}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: colors.secondaryLabel, fontVariant: ['tabular-nums'] }}>
                      {(update.durationMs / 1000).toFixed(1)}s
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
      <CollapsingHeader title={config.title} scrollY={scrollY} />
    </HealthScreen>
  );
}
