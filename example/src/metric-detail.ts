import { useCallback, useEffect, useState } from 'react';
import type { ColorValue } from 'react-native';
import * as HealthKit from '@appeeky/expo-healthkit';

import { daysAgo, startOfToday, startOfTomorrow } from '@/src/health';
import { colors } from '@/src/theme/colors';
import { usesMetricUnits } from '@/src/use-health-data';

export type DetailRange = 'D' | 'W' | 'M' | '6M' | 'Y';
export const DETAIL_RANGES: DetailRange[] = ['D', 'W', 'M', '6M', 'Y'];

type Aggregation = 'cumulative' | 'discrete';

export interface MetricDetailConfig {
  title: string;
  symbol: string;
  tint: ColorValue;
  type: string;
  unit: string;
  unitLabel: string;
  aggregation: Aggregation;
  digits: number;
}

export interface ChartBucket {
  start: Date;
  end: Date;
  /** Cumulative: sum. Discrete: average. `null` when the bucket has no samples. */
  value: number | null;
  min: number | null;
  max: number | null;
}

export interface MetricDetailData {
  buckets: ChartBucket[];
  /** Cumulative: daily average (or day total for `D`). Discrete: average. */
  headline: number | null;
  headlineLabel: string;
  min: number | null;
  max: number | null;
  from: Date;
  to: Date;
  samples: HealthKit.QuantitySample[];
  error: string | null;
  isLoading: boolean;
}

export function metricDetailConfig(key: string): MetricDetailConfig | null {
  const metric = usesMetricUnits();
  switch (key) {
    case 'steps':
      return {
        title: 'Steps',
        symbol: 'figure.walk',
        tint: colors.systemOrange,
        type: HealthKit.QuantityType.stepCount,
        unit: HealthKit.Unit.count,
        unitLabel: 'steps',
        aggregation: 'cumulative',
        digits: 0,
      };
    case 'energy':
      return {
        title: 'Active Energy',
        symbol: 'flame.fill',
        tint: colors.systemOrange,
        type: HealthKit.QuantityType.activeEnergyBurned,
        unit: HealthKit.Unit.kilocalorie,
        unitLabel: 'kcal',
        aggregation: 'cumulative',
        digits: 0,
      };
    case 'resting':
      return {
        title: 'Resting Energy',
        symbol: 'flame.fill',
        tint: colors.systemOrange,
        type: HealthKit.QuantityType.basalEnergyBurned,
        unit: HealthKit.Unit.kilocalorie,
        unitLabel: 'kcal',
        aggregation: 'cumulative',
        digits: 0,
      };
    case 'heart':
      return {
        title: 'Heart Rate',
        symbol: 'heart.fill',
        tint: colors.systemRed,
        type: HealthKit.QuantityType.heartRate,
        unit: HealthKit.Unit.countPerMinute,
        unitLabel: 'BPM',
        aggregation: 'discrete',
        digits: 0,
      };
    case 'weight':
      return {
        title: 'Weight',
        symbol: 'figure.stand',
        tint: colors.systemPurple,
        type: HealthKit.QuantityType.bodyMass,
        unit: metric ? HealthKit.Unit.kilogram : HealthKit.Unit.pound,
        unitLabel: metric ? 'kg' : 'lb',
        aggregation: 'discrete',
        digits: 1,
      };
    case 'height':
      return {
        title: 'Height',
        symbol: 'figure.stand',
        tint: colors.systemPurple,
        type: HealthKit.QuantityType.height,
        unit: metric ? HealthKit.Unit.centimeter : HealthKit.Unit.inch,
        unitLabel: metric ? 'cm' : 'in',
        aggregation: 'discrete',
        digits: 1,
      };
    case 'walking':
      return {
        title: 'Walking Steadiness',
        symbol: 'arrow.left.arrow.right',
        tint: colors.systemOrange,
        type: HealthKit.QuantityType.appleWalkingSteadiness,
        unit: HealthKit.Unit.percent,
        unitLabel: '%',
        aggregation: 'discrete',
        digits: 0,
      };
    default:
      return null;
  }
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const weekday = (result.getDay() + 6) % 7; // Monday = 0
  result.setDate(result.getDate() - weekday);
  return result;
}

function startOfMonth(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  return result;
}

function rangeWindow(range: DetailRange): { from: Date; to: Date } {
  const to = startOfTomorrow();
  switch (range) {
    case 'D':
      return { from: startOfToday(), to };
    case 'W':
      return { from: daysAgo(6), to };
    case 'M':
      return { from: daysAgo(30), to };
    case '6M': {
      const from = startOfWeek(new Date());
      from.setDate(from.getDate() - 7 * 25);
      return { from, to };
    }
    case 'Y': {
      const from = startOfMonth(new Date());
      from.setMonth(from.getMonth() - 11);
      return { from, to };
    }
  }
}

function bucketKey(range: DetailRange, date: Date): string {
  if (range === '6M') return startOfWeek(date).toISOString();
  if (range === 'Y') return startOfMonth(date).toISOString();
  return date.toISOString();
}

function bucketEnd(range: DetailRange, start: Date): Date {
  const end = new Date(start);
  if (range === 'D') end.setHours(end.getHours() + 1);
  else if (range === '6M') end.setDate(end.getDate() + 7);
  else if (range === 'Y') end.setMonth(end.getMonth() + 1);
  else end.setDate(end.getDate() + 1);
  return end;
}

/** Enumerate every bucket in the window so empty periods still render a slot. */
function emptyBuckets(range: DetailRange, from: Date, to: Date): Map<string, ChartBucket> {
  const result = new Map<string, ChartBucket>();
  let cursor = new Date(from);
  while (cursor < to) {
    const end = bucketEnd(range, cursor);
    result.set(bucketKey(range, cursor), { start: cursor, end, value: null, min: null, max: null });
    cursor = end;
  }
  return result;
}

interface RawStat {
  startDate: Date;
  endDate: Date;
  sum?: number;
  average?: number;
  min?: number;
  max?: number;
}

/** HealthKit returns hourly (D) or daily buckets; group daily into weeks/months client-side. */
function groupStats(range: DetailRange, config: MetricDetailConfig, from: Date, to: Date, stats: RawStat[]): ChartBucket[] {
  const buckets = emptyBuckets(range, from, to);
  const discreteAcc = new Map<string, { total: number; count: number }>();

  for (const stat of stats) {
    const key = bucketKey(range, stat.startDate);
    const bucket = buckets.get(key);
    if (!bucket) continue;

    if (config.aggregation === 'cumulative') {
      if (stat.sum == null) continue;
      bucket.value = (bucket.value ?? 0) + stat.sum;
    } else {
      if (stat.average == null) continue;
      const acc = discreteAcc.get(key) ?? { total: 0, count: 0 };
      acc.total += stat.average;
      acc.count += 1;
      discreteAcc.set(key, acc);
      bucket.value = acc.total / acc.count;
      bucket.min = bucket.min == null ? (stat.min ?? null) : Math.min(bucket.min, stat.min ?? bucket.min);
      bucket.max = bucket.max == null ? (stat.max ?? null) : Math.max(bucket.max, stat.max ?? bucket.max);
    }
  }

  return [...buckets.values()];
}

const EMPTY: MetricDetailData = {
  buckets: [],
  headline: null,
  headlineLabel: '',
  min: null,
  max: null,
  from: new Date(),
  to: new Date(),
  samples: [],
  error: null,
  isLoading: true,
};

export function useMetricDetail(config: MetricDetailConfig | null, range: DetailRange): MetricDetailData {
  const [data, setData] = useState<MetricDetailData>(EMPTY);

  const load = useCallback(async () => {
    if (!config) return;
    if (!HealthKit.isAvailable()) {
      setData({ ...EMPTY, isLoading: false, error: 'HealthKit is not available on this device.' });
      return;
    }

    const { from, to } = rangeWindow(range);
    setData((previous) => ({ ...previous, isLoading: true, error: null }));

    const isCumulative = config.aggregation === 'cumulative';
    const options = isCumulative
      ? HealthKit.StatisticsOption.cumulativeSum
      : HealthKit.StatisticsOption.discreteAverage |
        HealthKit.StatisticsOption.discreteMin |
        HealthKit.StatisticsOption.discreteMax;

    try {
      const [stats, samples] = await Promise.all([
        HealthKit.queryStatisticsCollection({
          type: config.type,
          unit: config.unit,
          from,
          to,
          interval: range === 'D' ? { hour: 1 } : { day: 1 },
          options,
        }),
        HealthKit.queryQuantitySamples({
          type: config.type,
          unit: config.unit,
          from,
          to,
          limit: 12,
          ascending: false,
        }),
      ]);

      const buckets = groupStats(range, config, from, to, stats);
      const filled = buckets.filter((bucket) => bucket.value != null);

      let headline: number | null = null;
      let headlineLabel = '';
      if (isCumulative) {
        // Daily average across days with data (Apple Health semantics); `D` shows the day total.
        const dailyValues = stats.map((stat) => stat.sum).filter((sum): sum is number => sum != null && sum > 0);
        if (range === 'D') {
          headline = dailyValues.reduce((total, value) => total + value, 0);
          headlineLabel = 'TOTAL';
        } else {
          headline = dailyValues.length ? dailyValues.reduce((total, value) => total + value, 0) / dailyValues.length : null;
          headlineLabel = 'DAILY AVERAGE';
        }
      } else {
        const averages = stats.map((stat) => stat.average).filter((value): value is number => value != null);
        headline = averages.length ? averages.reduce((total, value) => total + value, 0) / averages.length : null;
        headlineLabel = 'AVERAGE';
      }

      const min = filled.length ? Math.min(...filled.map((bucket) => bucket.min ?? bucket.value ?? 0)) : null;
      const max = filled.length ? Math.max(...filled.map((bucket) => bucket.max ?? bucket.value ?? 0)) : null;

      setData({ buckets, headline, headlineLabel, min, max, from, to, samples, error: null, isLoading: false });
    } catch (error) {
      setData({ ...EMPTY, from, to, isLoading: false, error: String(error) });
    }
  }, [config?.type, config?.unit, config?.aggregation, range]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!config) return;
    const subscription = HealthKit.addUpdateListener(({ type }) => {
      if (type === config.type) void load();
    });
    return () => subscription.remove();
  }, [config?.type, load]);

  return data;
}
