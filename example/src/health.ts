import * as HealthKit from '@appeeky/expo-healthkit';

export const READ_TYPES = [
  HealthKit.QuantityType.stepCount,
  HealthKit.QuantityType.heartRate,
  HealthKit.QuantityType.activeEnergyBurned,
  HealthKit.QuantityType.basalEnergyBurned,
  HealthKit.QuantityType.appleWalkingSteadiness,
  HealthKit.QuantityType.height,
  HealthKit.QuantityType.bodyMass,
  HealthKit.QuantityType.headphoneAudioExposure,
  HealthKit.CategoryType.sleepAnalysis,
  HealthKit.CategoryType.headphoneAudioExposureEvent,
  HealthKit.WorkoutType.workout,
  HealthKit.ActivitySummaryType.activitySummary,
];

export const WRITE_TYPES = [HealthKit.QuantityType.stepCount];

export async function requestHealthAccess(): Promise<boolean> {
  try {
    return await HealthKit.requestAuthorization({
      toRead: READ_TYPES,
      toShare: WRITE_TYPES,
    });
  } catch {
    return HealthKit.requestAuthorization({
      toRead: READ_TYPES.filter(
        (type) => type !== HealthKit.ActivitySummaryType.activitySummary
      ),
      toShare: WRITE_TYPES,
    });
  }
}

export function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function daysAgo(count: number): Date {
  const date = startOfToday();
  date.setDate(date.getDate() - count);
  return date;
}
