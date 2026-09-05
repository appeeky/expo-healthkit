import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { ColorValue } from 'react-native';
import * as HealthKit from '@appeeky/expo-healthkit';

import { daysAgo, startOfToday } from '@/src/health';
import { usePermissionSheet } from '@/src/permission-context';
import { colors } from '@/src/theme/colors';

export interface HealthMetric {
  key: string;
  title: string;
  symbol: string;
  tint: ColorValue;
  value: number | null;
  displayValue: string | null;
  unit: string;
  date: Date | null;
  subtitle?: string;
  subtitleTint?: ColorValue;
  chart?: number[];
}

interface HealthSnapshot {
  metrics: HealthMetric[];
  error: string | null;
}

const ASLEEP_VALUES = new Set<number>([
  HealthKit.SleepAnalysisValue.asleepUnspecified,
  HealthKit.SleepAnalysisValue.asleepCore,
  HealthKit.SleepAnalysisValue.asleepDeep,
  HealthKit.SleepAnalysisValue.asleepREM,
]);

const HEADPHONE_OK_DB = 80;

function usesMetricUnits(): boolean {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return !locale.startsWith('en-us');
}

function formatNumber(value: number, maximumFractionDigits: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  });
}

function formatEnergy(kcal: number): string {
  const digits = Math.abs(kcal) >= 10 || Number.isInteger(kcal) ? 0 : 1;
  return formatNumber(kcal, digits);
}

function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${minutes} min`;
  }
  if (minutes <= 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${minutes} min`;
}

function formatImperialHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const rest = Math.round(inches % 12);
  return `${feet}' ${rest}"`;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(date: Date, other: Date): boolean {
  return date.toDateString() === other.toDateString();
}

function sleepNightKey(date: Date): string {
  const shifted = new Date(date);
  if (shifted.getHours() < 12) {
    shifted.setDate(shifted.getDate() - 1);
  }
  return localDateKey(shifted);
}

async function cumulativeToday(type: string, unit: string): Promise<{ value: number; date: Date }> {
  try {
    const stats = await HealthKit.queryStatistics({
      type,
      unit,
      from: startOfToday(),
      to: new Date(),
      options: HealthKit.StatisticsOption.cumulativeSum,
    });
    return { value: stats.sum ?? 0, date: stats.endDate ?? new Date() };
  } catch {
    return { value: 0, date: new Date() };
  }
}

async function hourlyToday(type: string, unit: string): Promise<number[]> {
  try {
    const buckets = await HealthKit.queryStatisticsCollection({
      type,
      unit,
      from: startOfToday(),
      to: new Date(),
      interval: { hour: 1 },
      options: HealthKit.StatisticsOption.cumulativeSum,
    });
    return buckets.map((item) => item.sum ?? 0).slice(-12);
  } catch {
    return [];
  }
}

async function latestQuantity(
  type: string,
  unit: string,
  from?: Date
): Promise<{ value: number; date: Date } | null> {
  try {
    const stats = await HealthKit.queryStatistics({
      type,
      unit,
      from,
      options: HealthKit.StatisticsOption.discreteMostRecent,
    });
    if (stats.mostRecent != null) {
      return { value: stats.mostRecent, date: stats.endDate };
    }
  } catch {
    // Some discrete types reject statistics; fall through to a sample query.
  }

  try {
    const samples = await HealthKit.queryQuantitySamples({
      type,
      unit,
      from,
      limit: 1,
      ascending: false,
    });
    const sample = samples[0];
    if (!sample) {
      return null;
    }
    return { value: sample.value, date: sample.endDate };
  } catch {
    return null;
  }
}

export function isTodayMetric(metric: HealthMetric): boolean {
  return metric.date != null && isSameDay(metric.date, new Date());
}

function healthKitMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = 'code' in error && error.code != null ? String(error.code) : null;
    return code ? `${code}: ${error.message}` : error.message;
  }
  return String(error);
}

function recover<T>(fallback: T, label: string, warnings: string[]) {
  return (error: unknown): T => {
    const message = `${label}: ${healthKitMessage(error)}`;
    warnings.push(message);
    console.warn(`[expo-healthkit] ${message}`);
    return fallback;
  };
}

export function useHealthSnapshot() {
  const { authRevision } = usePermissionSheet();
  const [snapshot, setSnapshot] = useState<HealthSnapshot>({ metrics: [], error: null });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        if (!HealthKit.isAvailable()) {
          setSnapshot({ metrics: [], error: 'HealthKit is not available on this device.' });
          return;
        }

        const metricUnits = usesMetricUnits();
        const heightUnit = metricUnits ? HealthKit.Unit.centimeter : HealthKit.Unit.inch;
        const weightUnit = metricUnits ? HealthKit.Unit.kilogram : HealthKit.Unit.pound;

        const warnings: string[] = [];

        try {
          const [
            steps,
            energy,
            resting,
            heartRate,
            walking,
            height,
            weight,
            sleep,
            workouts,
            stepDays,
            energyHours,
            restingHours,
            headphones,
            headphoneEvents,
            summaries,
          ] = await Promise.all([
            cumulativeToday(HealthKit.QuantityType.stepCount, HealthKit.Unit.count),
            cumulativeToday(HealthKit.QuantityType.activeEnergyBurned, HealthKit.Unit.kilocalorie),
            cumulativeToday(HealthKit.QuantityType.basalEnergyBurned, HealthKit.Unit.kilocalorie),
            latestQuantity(
              HealthKit.QuantityType.heartRate,
              HealthKit.Unit.countPerMinute,
              startOfToday()
            ),
            latestQuantity(HealthKit.QuantityType.appleWalkingSteadiness, HealthKit.Unit.percent),
            latestQuantity(HealthKit.QuantityType.height, heightUnit),
            latestQuantity(HealthKit.QuantityType.bodyMass, weightUnit),
            HealthKit.queryCategorySamples({
              type: HealthKit.CategoryType.sleepAnalysis,
              from: daysAgo(800),
              to: new Date(),
              limit: 200,
              ascending: false,
            }).catch(recover([], 'Sleep', warnings)),
            HealthKit.queryWorkouts({
              from: startOfToday(),
              to: new Date(),
            }).catch(recover([], 'Workouts', warnings)),
            HealthKit.queryStatisticsCollection({
              type: HealthKit.QuantityType.stepCount,
              unit: HealthKit.Unit.count,
              from: daysAgo(6),
              to: new Date(),
              interval: { day: 1 },
              options: HealthKit.StatisticsOption.cumulativeSum,
            }).catch(recover([], 'Steps chart', warnings)),
            hourlyToday(HealthKit.QuantityType.activeEnergyBurned, HealthKit.Unit.kilocalorie),
            hourlyToday(HealthKit.QuantityType.basalEnergyBurned, HealthKit.Unit.kilocalorie),
            HealthKit.queryStatistics({
              type: HealthKit.QuantityType.headphoneAudioExposure,
              unit: HealthKit.Unit.decibelAWeightedSoundPressureLevel,
              from: daysAgo(7),
              to: new Date(),
              options: HealthKit.StatisticsOption.discreteAverage,
            }).catch(recover(null, 'Headphones', warnings)),
            HealthKit.queryCategorySamples({
              type: HealthKit.CategoryType.headphoneAudioExposureEvent,
              limit: 20,
              ascending: false,
            }).catch(recover([], 'Headphone events', warnings)),
            HealthKit.queryActivitySummaries({
              from: startOfToday(),
              to: new Date(),
            }).catch(recover([], 'Activity rings', warnings)),
          ]);

          if (cancelled) {
            return;
          }

          const latestSleep = sleep[0];
          const sleepNight = latestSleep ? sleepNightKey(latestSleep.endDate) : null;
          const nightSleep = sleep.filter(
            (sample) =>
              sleepNight != null &&
              (sleepNightKey(sample.startDate) === sleepNight ||
                sleepNightKey(sample.endDate) === sleepNight)
          );
          const inBedSeconds = nightSleep.reduce((total, sample) => {
            if (sample.value !== HealthKit.SleepAnalysisValue.inBed) {
              return total;
            }
            return total + (sample.endDate.getTime() - sample.startDate.getTime()) / 1000;
          }, 0);
          const asleepSeconds = nightSleep.reduce((total, sample) => {
            if (!ASLEEP_VALUES.has(sample.value)) {
              return total;
            }
            return total + (sample.endDate.getTime() - sample.startDate.getTime()) / 1000;
          }, 0);
          const sleepSeconds = inBedSeconds > 0 ? inBedSeconds : asleepSeconds;
          const todayKey = localDateKey(new Date());
          const activity = summaries.find((item) => item.date === todayKey) ?? summaries.at(-1);
          const headphoneAverage = headphones?.average ?? null;

          const metrics: HealthMetric[] = [
            {
              key: 'headphones',
              title: 'Headphone Audio Levels',
              symbol: 'ear',
              tint: colors.systemBlue,
              value: headphoneAverage,
              displayValue:
                headphoneAverage == null
                  ? null
                  : headphoneAverage < HEADPHONE_OK_DB
                    ? 'OK'
                    : formatNumber(headphoneAverage, 0),
              unit: headphoneAverage == null || headphoneAverage < HEADPHONE_OK_DB ? '' : 'dB',
              date: headphones?.endDate ?? null,
              subtitle: '7-Day Exposure',
            },
            {
              key: 'activity',
              title: 'Activity',
              symbol: 'flame.fill',
              tint: colors.systemPink,
              value: activity ? activity.activeEnergyBurned : null,
              displayValue: activity ? formatEnergy(activity.activeEnergyBurned) : null,
              unit: 'kcal',
              date: activity ? new Date(`${activity.date}T12:00:00`) : null,
              subtitle: 'Move',
              subtitleTint: colors.systemRed,
            },
            {
              key: 'energy',
              title: 'Active Energy',
              symbol: 'flame.fill',
              tint: colors.systemOrange,
              value: energy.value,
              displayValue: formatEnergy(energy.value),
              unit: 'kcal',
              date: energy.date,
              chart: energyHours,
            },
            {
              key: 'resting',
              title: 'Resting Energy',
              symbol: 'flame.fill',
              tint: colors.systemOrange,
              value: resting.value,
              displayValue: formatEnergy(resting.value),
              unit: 'kcal',
              date: resting.date,
              chart: restingHours,
            },
            {
              key: 'steps',
              title: 'Steps',
              symbol: 'figure.walk',
              tint: colors.systemOrange,
              value: Math.round(steps.value),
              displayValue: Math.round(steps.value).toLocaleString(),
              unit: 'steps',
              date: steps.date,
              chart: stepDays.map((item) => item.sum ?? 0),
            },
            {
              key: 'heart',
              title: 'Heart Rate',
              symbol: 'heart.fill',
              tint: colors.systemRed,
              value: heartRate ? Math.round(heartRate.value) : null,
              displayValue: heartRate ? String(Math.round(heartRate.value)) : null,
              unit: 'BPM',
              date: heartRate?.date ?? null,
            },
            {
              key: 'sleep',
              title: 'Sleep',
              symbol: 'bed.double.fill',
              tint: colors.systemPurple,
              value: sleep.length ? sleepSeconds : null,
              displayValue: sleep.length ? formatDuration(sleepSeconds) : null,
              unit: '',
              date: latestSleep?.endDate ?? null,
              subtitle: inBedSeconds > 0 ? 'Time in Bed' : 'Time Asleep',
            },
            {
              key: 'height',
              title: 'Height',
              symbol: 'figure.stand',
              tint: colors.systemPurple,
              value: height?.value ?? null,
              displayValue: height
                ? metricUnits
                  ? formatNumber(height.value, 2)
                  : formatImperialHeight(height.value)
                : null,
              unit: height ? (metricUnits ? 'cm' : '') : '',
              date: height?.date ?? null,
            },
            {
              key: 'weight',
              title: 'Weight',
              symbol: 'figure.stand',
              tint: colors.systemPurple,
              value: weight?.value ?? null,
              displayValue: weight ? formatNumber(weight.value, 1) : null,
              unit: weight ? (metricUnits ? 'kg' : 'lb') : '',
              date: weight?.date ?? null,
            },
            {
              key: 'headphone-events',
              title: 'Headphone Notifications',
              symbol: 'ear',
              tint: colors.systemBlue,
              value: headphoneEvents.length ? headphoneEvents.length : null,
              displayValue: headphoneEvents.length ? String(headphoneEvents.length) : null,
              unit: '',
              date: headphoneEvents[0]?.endDate ?? null,
            },
            {
              key: 'walking',
              title: 'Walking Steadiness',
              symbol: 'arrow.left.arrow.right',
              tint: colors.systemOrange,
              value: walking ? Math.round(walking.value) : null,
              displayValue: walking ? String(Math.round(walking.value)) : null,
              unit: '%',
              date: walking?.date ?? null,
            },
            {
              key: 'workouts',
              title: 'Workouts',
              symbol: 'figure.run',
              tint: colors.systemOrange,
              value: workouts.length ? workouts.length : null,
              displayValue: workouts.length ? String(workouts.length) : null,
              unit: workouts.length === 1 ? 'workout' : 'workouts',
              date: workouts.at(-1)?.endDate ?? null,
            },
          ].filter((item) => item.displayValue != null);

          setSnapshot({ metrics, error: warnings.length ? warnings.join('\n') : null });
        } catch (loadError) {
          if (!cancelled) {
            setSnapshot({ metrics: [], error: String(loadError) });
          }
        }
      }

      void load();
      return () => {
        cancelled = true;
      };
    }, [authRevision])
  );

  return snapshot;
}
