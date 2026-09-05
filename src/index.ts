import { useEvent } from 'expo';
import { Platform } from 'react-native';

import ExpoHealthKitModule from './ExpoHealthKitModule';
import { fromIso, resolveEndDate, toIso, toOptionalIso } from './dates';
import { HealthKitUnavailableError } from './errors';
import {
  AuthorizationRequestStatus,
  AuthorizationStatus,
  BiologicalSex,
  BloodType,
  CategoryType,
  CharacteristicType,
  ClinicalType,
  CorrelationType,
  ElectrocardiogramClassification,
  ElectrocardiogramSymptomsStatus,
  ElectrocardiogramType,
  AudiogramType,
  ActivitySummaryType,
  SeriesType,
  FitzpatrickSkinType,
  QuantityType,
  SleepAnalysisValue,
  StatisticsOption,
  Unit,
  UpdateFrequency,
  WheelchairUse,
  WorkoutActivityType,
  WorkoutType,
} from './identifiers';
import type {
  AnchoredQueryOptions,
  AnchoredQueryResult,
  AuthorizationOptions,
  CategorySample,
  CategorySampleInput,
  ClinicalRecord,
  ClinicalRecordQueryOptions,
  Correlation,
  CorrelationInput,
  CorrelationQueryOptions,
  DeleteObjectsOptions,
  ElectrocardiogramQueryOptions,
  ElectrocardiogramSample,
  ActivitySummary,
  ActivitySummaryQueryOptions,
  AudiogramSample,
  DateRangeQueryOptions,
  HeartbeatSeriesQueryOptions,
  HeartbeatSeriesSample,
  QuantityQueryOptions,
  QuantitySample,
  SampleQueryOptions,
  QuantitySampleInput,
  Statistics,
  StatisticsCollectionQueryOptions,
  StatisticsQueryOptions,
  WorkoutInput,
  WorkoutQueryOptions,
  WorkoutRoute,
  WorkoutRouteQueryOptions,
  WorkoutSample,
} from './types';

export * from './identifiers';
export * from './errors';
export type * from './types';

const HK_UNLIMITED = 0;

function isHealthPlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function assertAvailable(): void {
  if (!isHealthPlatform() || !ExpoHealthKitModule.isHealthDataAvailable()) {
    throw new HealthKitUnavailableError();
  }
}

export function isAvailable(): boolean {
  return isHealthPlatform() && ExpoHealthKitModule.isHealthDataAvailable();
}

export async function requestAuthorization(options: AuthorizationOptions = {}): Promise<boolean> {
  assertAvailable();
  return ExpoHealthKitModule.requestAuthorization({
    toRead: [...(options.toRead ?? [])],
    toShare: [...(options.toShare ?? [])],
  });
}

export async function getAuthorizationStatus(type: string): Promise<AuthorizationStatus> {
  assertAvailable();
  return (await ExpoHealthKitModule.getAuthorizationStatus(type)) as AuthorizationStatus;
}

export async function getRequestStatusForAuthorization(
  options: AuthorizationOptions = {}
): Promise<AuthorizationRequestStatus> {
  assertAvailable();
  return (await ExpoHealthKitModule.getRequestStatusForAuthorization({
    toRead: [...(options.toRead ?? [])],
    toShare: [...(options.toShare ?? [])],
  })) as AuthorizationRequestStatus;
}

export async function queryQuantitySamples(
  options: QuantityQueryOptions
): Promise<QuantitySample[]> {
  assertAvailable();
  const samples = await ExpoHealthKitModule.queryQuantitySamples({
    type: options.type,
    unit: options.unit,
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
    limit: options.limit ?? HK_UNLIMITED,
    ascending: options.ascending ?? false,
  });

  return samples.map((sample) => ({
    ...sample,
    startDate: fromIso(sample.startDate),
    endDate: fromIso(sample.endDate),
  }));
}

export async function queryCategorySamples(options: SampleQueryOptions): Promise<CategorySample[]> {
  assertAvailable();
  const samples = await ExpoHealthKitModule.queryCategorySamples({
    type: options.type,
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
    limit: options.limit ?? HK_UNLIMITED,
    ascending: options.ascending ?? false,
  });

  return samples.map((sample) => ({
    ...sample,
    startDate: fromIso(sample.startDate),
    endDate: fromIso(sample.endDate),
  }));
}

export async function queryWorkouts(options: WorkoutQueryOptions = {}): Promise<WorkoutSample[]> {
  assertAvailable();
  const samples = await ExpoHealthKitModule.queryWorkouts({
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
    limit: options.limit ?? HK_UNLIMITED,
    ascending: options.ascending ?? false,
    activityType: options.activityType,
  });

  return samples.map((sample) => ({
    ...sample,
    startDate: fromIso(sample.startDate),
    endDate: fromIso(sample.endDate),
    workoutActivityType: sample.workoutActivityType as WorkoutSample['workoutActivityType'],
  }));
}

export async function queryElectrocardiograms(
  options: ElectrocardiogramQueryOptions = {}
): Promise<ElectrocardiogramSample[]> {
  assertAvailable();
  const samples = await ExpoHealthKitModule.queryElectrocardiograms({
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
    limit: options.limit ?? HK_UNLIMITED,
    ascending: options.ascending ?? false,
    includeVoltage: options.includeVoltage ?? false,
  });

  return samples.map((sample) => ({
    ...sample,
    startDate: fromIso(sample.startDate),
    endDate: fromIso(sample.endDate),
    classification: sample.classification as ElectrocardiogramSample['classification'],
    symptomsStatus: sample.symptomsStatus as ElectrocardiogramSample['symptomsStatus'],
  }));
}

export async function queryActivitySummaries(
  options: ActivitySummaryQueryOptions = {}
): Promise<ActivitySummary[]> {
  assertAvailable();
  return ExpoHealthKitModule.queryActivitySummaries({
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
  });
}

export async function queryClinicalRecords(
  options: ClinicalRecordQueryOptions
): Promise<ClinicalRecord[]> {
  assertAvailable();
  const samples = await ExpoHealthKitModule.queryClinicalRecords({
    type: options.type,
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
    limit: options.limit ?? HK_UNLIMITED,
    ascending: options.ascending ?? false,
  });

  return samples.map((sample) => ({
    ...sample,
    startDate: fromIso(sample.startDate),
    endDate: fromIso(sample.endDate),
  }));
}

export async function queryAudiograms(
  options: DateRangeQueryOptions = {}
): Promise<AudiogramSample[]> {
  assertAvailable();
  const samples = await ExpoHealthKitModule.queryAudiograms({
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
    limit: options.limit ?? HK_UNLIMITED,
    ascending: options.ascending ?? false,
  });

  return samples.map((sample) => ({
    ...sample,
    startDate: fromIso(sample.startDate),
    endDate: fromIso(sample.endDate),
  }));
}

export async function queryWorkoutRoute(
  options: WorkoutRouteQueryOptions
): Promise<WorkoutRoute[]> {
  assertAvailable();
  const routes = await ExpoHealthKitModule.queryWorkoutRoute({
    workoutUUID: options.workoutUUID,
  });

  return routes.map((route) => ({
    ...route,
    startDate: fromIso(route.startDate),
    endDate: fromIso(route.endDate),
    locations: route.locations.map((location) => ({
      ...location,
      timestamp: fromIso(location.timestamp),
    })),
  }));
}

function mapQuantitySample(sample: {
  uuid: string;
  type: string;
  startDate: string;
  endDate: string;
  value: number;
  unit: string;
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}) {
  return {
    ...sample,
    startDate: fromIso(sample.startDate),
    endDate: fromIso(sample.endDate),
  };
}

export async function queryCorrelations(options: CorrelationQueryOptions): Promise<Correlation[]> {
  assertAvailable();
  const samples = await ExpoHealthKitModule.queryCorrelations({
    type: options.type,
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
    limit: options.limit ?? HK_UNLIMITED,
    ascending: options.ascending ?? false,
  });

  return samples.map((sample) => ({
    ...sample,
    startDate: fromIso(sample.startDate),
    endDate: fromIso(sample.endDate),
    objects: sample.objects.map(mapQuantitySample),
  }));
}

export async function queryHeartbeatSeries(
  options: HeartbeatSeriesQueryOptions = {}
): Promise<HeartbeatSeriesSample[]> {
  assertAvailable();
  const samples = await ExpoHealthKitModule.queryHeartbeatSeries({
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
    limit: options.limit ?? HK_UNLIMITED,
    ascending: options.ascending ?? false,
    includeBeats: options.includeBeats ?? true,
  });

  return samples.map((sample) => ({
    ...sample,
    startDate: fromIso(sample.startDate),
    endDate: fromIso(sample.endDate),
  }));
}

export async function queryStatistics(options: StatisticsQueryOptions): Promise<Statistics> {
  assertAvailable();
  const stats = await ExpoHealthKitModule.queryStatistics({
    type: options.type,
    unit: options.unit,
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
    options: options.options ?? 0,
  });

  return {
    ...stats,
    startDate: fromIso(stats.startDate),
    endDate: fromIso(stats.endDate),
  };
}

export async function queryStatisticsCollection(
  options: StatisticsCollectionQueryOptions
): Promise<Statistics[]> {
  assertAvailable();
  const interval = options.interval ?? { day: 1 };
  const results = await ExpoHealthKitModule.queryStatisticsCollection({
    type: options.type,
    unit: options.unit,
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
    options: options.options ?? 0,
    year: interval.year ?? 0,
    month: interval.month ?? 0,
    day: interval.day ?? 0,
    hour: interval.hour ?? 0,
    minute: interval.minute ?? 0,
    second: interval.second ?? 0,
  });

  return results.map((stats) => ({
    ...stats,
    startDate: fromIso(stats.startDate),
    endDate: fromIso(stats.endDate),
  }));
}

export async function queryAnchored(options: AnchoredQueryOptions): Promise<AnchoredQueryResult> {
  assertAvailable();
  const result = await ExpoHealthKitModule.queryAnchored({
    type: options.type,
    unit: options.unit,
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
    limit: options.limit ?? HK_UNLIMITED,
    anchor: options.anchor ?? undefined,
  });

  return {
    added: result.added.map((sample) => ({
      ...sample,
      startDate: fromIso(sample.startDate),
      endDate: fromIso(sample.endDate),
    })),
    deleted: result.deleted,
    anchor: result.anchor ?? null,
  };
}

export async function saveQuantitySample(sample: QuantitySampleInput): Promise<string> {
  assertAvailable();
  return ExpoHealthKitModule.saveQuantitySample({
    type: sample.type,
    unit: sample.unit,
    value: sample.value,
    startDate: toIso(sample.startDate),
    endDate: resolveEndDate(sample.startDate, sample.endDate),
    metadata: sample.metadata,
  });
}

export async function saveCategorySample(sample: CategorySampleInput): Promise<string> {
  assertAvailable();
  return ExpoHealthKitModule.saveCategorySample({
    type: sample.type,
    value: sample.value,
    startDate: toIso(sample.startDate),
    endDate: resolveEndDate(sample.startDate, sample.endDate),
    metadata: sample.metadata,
  });
}

export async function saveWorkout(workout: WorkoutInput): Promise<string> {
  assertAvailable();
  return ExpoHealthKitModule.saveWorkout({
    activityType: workout.activityType,
    startDate: toIso(workout.startDate),
    endDate: toIso(workout.endDate),
    energyBurned: workout.energyBurned,
    energyBurnedUnit: workout.energyBurnedUnit,
    distance: workout.distance,
    distanceUnit: workout.distanceUnit,
    metadata: workout.metadata,
  });
}

export async function saveCorrelation(correlation: CorrelationInput): Promise<string> {
  assertAvailable();
  const startDate = toIso(correlation.startDate);
  const endDate = resolveEndDate(correlation.startDate, correlation.endDate);
  return ExpoHealthKitModule.saveCorrelation({
    type: correlation.type,
    startDate,
    endDate,
    objects: correlation.objects.map((object) => ({
      type: object.type,
      unit: object.unit,
      value: object.value,
      startDate: toIso(object.startDate ?? correlation.startDate),
      endDate: resolveEndDate(
        object.endDate ?? object.startDate ?? correlation.startDate,
        object.endDate ?? correlation.endDate
      ),
      metadata: object.metadata,
    })),
    metadata: correlation.metadata,
  });
}

export async function deleteObjects(options: DeleteObjectsOptions): Promise<number> {
  assertAvailable();
  return ExpoHealthKitModule.deleteObjects({
    uuid: options.uuid,
    type: options.type,
    from: toOptionalIso(options.from),
    to: toOptionalIso(options.to),
  });
}

export async function getBiologicalSex(): Promise<BiologicalSex> {
  assertAvailable();
  return (await ExpoHealthKitModule.getBiologicalSex()) as BiologicalSex;
}

export async function getBloodType(): Promise<BloodType> {
  assertAvailable();
  return (await ExpoHealthKitModule.getBloodType()) as BloodType;
}

export async function getDateOfBirth(): Promise<Date | null> {
  assertAvailable();
  const value = await ExpoHealthKitModule.getDateOfBirth();
  return value ? fromIso(value) : null;
}

export async function getFitzpatrickSkinType(): Promise<FitzpatrickSkinType> {
  assertAvailable();
  return (await ExpoHealthKitModule.getFitzpatrickSkinType()) as FitzpatrickSkinType;
}

export async function getWheelchairUse(): Promise<WheelchairUse> {
  assertAvailable();
  return (await ExpoHealthKitModule.getWheelchairUse()) as WheelchairUse;
}

export async function enableBackgroundDelivery(
  type: string,
  frequency: UpdateFrequency
): Promise<boolean> {
  assertAvailable();
  return ExpoHealthKitModule.enableBackgroundDelivery(type, frequency);
}

export async function disableBackgroundDelivery(type: string): Promise<boolean> {
  assertAvailable();
  return ExpoHealthKitModule.disableBackgroundDelivery(type);
}

export async function disableAllBackgroundDelivery(): Promise<boolean> {
  assertAvailable();
  return ExpoHealthKitModule.disableAllBackgroundDelivery();
}

export async function observe(types: readonly string[]): Promise<void> {
  assertAvailable();
  await ExpoHealthKitModule.observeTypes([...types]);
}

export async function clearObservers(): Promise<void> {
  assertAvailable();
  await ExpoHealthKitModule.clearObserverQueries();
}

export function addUpdateListener(listener: (event: { type: string }) => void): { remove(): void } {
  return ExpoHealthKitModule.addListener('onUpdate', listener);
}

export function useHealthKitUpdates() {
  return useEvent(ExpoHealthKitModule, 'onUpdate');
}

const HealthKit = {
  isAvailable,
  requestAuthorization,
  getAuthorizationStatus,
  getRequestStatusForAuthorization,
  queryQuantitySamples,
  queryCategorySamples,
  queryWorkouts,
  queryElectrocardiograms,
  queryActivitySummaries,
  queryClinicalRecords,
  queryAudiograms,
  queryWorkoutRoute,
  queryCorrelations,
  queryHeartbeatSeries,
  queryStatistics,
  queryStatisticsCollection,
  queryAnchored,
  saveQuantitySample,
  saveCategorySample,
  saveWorkout,
  saveCorrelation,
  deleteObjects,
  getBiologicalSex,
  getBloodType,
  getDateOfBirth,
  getFitzpatrickSkinType,
  getWheelchairUse,
  enableBackgroundDelivery,
  disableBackgroundDelivery,
  disableAllBackgroundDelivery,
  observe,
  clearObservers,
  addUpdateListener,
  useHealthKitUpdates,
  QuantityType,
  CategoryType,
  CharacteristicType,
  CorrelationType,
  WorkoutType,
  ElectrocardiogramType,
  AudiogramType,
  SeriesType,
  ActivitySummaryType,
  ClinicalType,
  Unit,
  WorkoutActivityType,
  SleepAnalysisValue,
  UpdateFrequency,
  StatisticsOption,
  AuthorizationStatus,
  AuthorizationRequestStatus,
  BiologicalSex,
  BloodType,
  FitzpatrickSkinType,
  WheelchairUse,
  ElectrocardiogramClassification,
  ElectrocardiogramSymptomsStatus,
};

export default HealthKit;
