import { Text, View } from 'react-native';
import type { ColorValue } from 'react-native';

import type { ChartBucket, DetailRange } from '@/src/metric-detail';
import { colors } from '@/src/theme/colors';

interface RangeChartProps {
  buckets: ChartBucket[];
  range: DetailRange;
  tint: ColorValue;
  /** Discrete metrics draw a floating min–max bar; cumulative draws from zero. */
  isDiscrete: boolean;
  digits: number;
}

const CHART_HEIGHT = 220;
const AXIS_WIDTH = 46;

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function niceFloor(value: number): number {
  if (value <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.floor(value / magnitude) * magnitude;
}

function formatAxis(value: number, digits: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function axisLabel(range: DetailRange, bucket: ChartBucket, index: number, count: number): string | null {
  const date = bucket.start;
  switch (range) {
    case 'D':
      return index % 6 === 0 ? date.toLocaleTimeString(undefined, { hour: 'numeric' }) : null;
    case 'W':
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    case 'M':
      return index % 7 === 0 ? String(date.getDate()) : null;
    case '6M':
      return date.getDate() <= 7 ? date.toLocaleDateString(undefined, { month: 'short' }) : null;
    case 'Y':
      return index % 2 === 0 || count <= 6 ? date.toLocaleDateString(undefined, { month: 'narrow' }) : null;
  }
}

export function RangeChart({ buckets, range, tint, isDiscrete, digits }: RangeChartProps) {
  const values = buckets.flatMap((bucket) =>
    isDiscrete ? [bucket.min, bucket.max, bucket.value] : [bucket.value]
  ).filter((value): value is number => value != null);

  const rawMax = values.length ? Math.max(...values) : 0;
  const rawMin = values.length && isDiscrete ? Math.min(...values) : 0;
  const top = niceCeil(rawMax === 0 ? 10 ** Math.max(1, digits + 1) : rawMax * 1.05);
  const bottom = isDiscrete ? niceFloor(rawMin * 0.9) : 0;
  const span = Math.max(1, top - bottom);
  const gridValues = [top, bottom + span / 2, bottom];

  const y = (value: number) => ((value - bottom) / span) * CHART_HEIGHT;
  const gap = buckets.length > 40 ? 1 : buckets.length > 20 ? 2 : buckets.length > 10 ? 4 : 8;
  const hasAnyValue = values.length > 0;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', height: CHART_HEIGHT }}>
        <View style={{ flex: 1, position: 'relative' }}>
          {gridValues.map((value) => (
            <View
              key={`grid-${value}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: y(value) - 0.5,
                height: 1,
                backgroundColor: colors.systemFill,
              }}
            />
          ))}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap }}>
            {buckets.map((bucket, index) => {
              const isLast = index === buckets.length - 1;
              if (bucket.value == null) {
                return <View key={bucket.start.toISOString()} style={{ flex: 1 }} />;
              }
              const lower = isDiscrete ? (bucket.min ?? bucket.value) : bottom;
              const upper = isDiscrete ? (bucket.max ?? bucket.value) : bucket.value;
              const height = Math.max(4, y(upper) - y(lower));
              return (
                <View key={bucket.start.toISOString()} style={{ flex: 1, height: CHART_HEIGHT, justifyContent: 'flex-end' }}>
                  <View
                    style={{
                      height,
                      marginBottom: y(lower),
                      borderRadius: 3,
                      backgroundColor: tint,
                      opacity: isLast ? 1 : 0.85,
                    }}
                  />
                </View>
              );
            })}
          </View>
        </View>
        <View style={{ width: AXIS_WIDTH, position: 'relative' }}>
          {gridValues.map((value) => (
            <Text
              key={`axis-${value}`}
              style={{
                position: 'absolute',
                right: 0,
                bottom: y(value) - 8,
                fontSize: 12,
                color: colors.secondaryLabel,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatAxis(value, digits)}
            </Text>
          ))}
        </View>
      </View>
      {/* Labels are absolutely positioned so narrow slots (31 days, 24 hours) don't truncate them. */}
      <View style={{ height: 16, marginRight: AXIS_WIDTH, position: 'relative' }}>
        {buckets.map((bucket, index) => {
          const label = axisLabel(range, bucket, index, buckets.length);
          if (!label) return null;
          const slot = 100 / buckets.length;
          return (
            <Text
              key={`label-${bucket.start.toISOString()}`}
              numberOfLines={1}
              style={{
                position: 'absolute',
                left: `${index * slot + (range === 'W' ? slot / 2 : 0)}%`,
                transform: range === 'W' ? [{ translateX: '-50%' }] : undefined,
                fontSize: 12,
                color: colors.secondaryLabel,
              }}
            >
              {label}
            </Text>
          );
        })}
      </View>
      {!hasAnyValue ? (
        <Text style={{ textAlign: 'center', color: colors.secondaryLabel, fontSize: 15, paddingTop: 4 }}>
          No data in this range
        </Text>
      ) : null}
    </View>
  );
}
