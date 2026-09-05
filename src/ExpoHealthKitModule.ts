import { NativeModule, requireNativeModule } from 'expo';

import { HealthKitError } from './errors';

import type {
  ExpoHealthKitModuleEvents,
  NativeActivitySummary,
  NativeActivitySummaryQueryOptions,
  NativeAnchoredQueryOptions,
  NativeAnchoredQueryResult,
  NativeAudiogramSample,
  NativeAuthorizationOptions,
  NativeCategoryQueryOptions,
  NativeCategorySample,
  NativeCategorySampleInput,
  NativeClinicalRecord,
  NativeClinicalRecordQueryOptions,
  NativeCorrelation,
  NativeCorrelationInput,
  NativeCorrelationQueryOptions,
  NativeDateRangeQueryOptions,
  NativeDeleteObjectsOptions,
  NativeElectrocardiogramQueryOptions,
  NativeElectrocardiogramSample,
  NativeHeartbeatSeriesQueryOptions,
  NativeHeartbeatSeriesSample,
  NativeQuantityQueryOptions,
  NativeQuantitySample,
  NativeQuantitySampleInput,
  NativeStatistics,
  NativeStatisticsCollectionQueryOptions,
  NativeStatisticsQueryOptions,
  NativeWorkoutInput,
  NativeWorkoutQueryOptions,
  NativeWorkoutRoute,
  NativeWorkoutRouteQueryOptions,
  NativeWorkoutSample,
} from './types';

declare class ExpoHealthKitModule extends NativeModule<ExpoHealthKitModuleEvents> {
  isHealthDataAvailable(): boolean;
  requestAuthorization(options: NativeAuthorizationOptions): Promise<boolean>;
  getAuthorizationStatus(identifier: string): Promise<number>;
  getRequestStatusForAuthorization(options: NativeAuthorizationOptions): Promise<number>;
  queryQuantitySamples(options: NativeQuantityQueryOptions): Promise<NativeQuantitySample[]>;
  queryCategorySamples(options: NativeCategoryQueryOptions): Promise<NativeCategorySample[]>;
  queryWorkouts(options: NativeWorkoutQueryOptions): Promise<NativeWorkoutSample[]>;
  queryElectrocardiograms(
    options: NativeElectrocardiogramQueryOptions
  ): Promise<NativeElectrocardiogramSample[]>;
  queryActivitySummaries(
    options: NativeActivitySummaryQueryOptions
  ): Promise<NativeActivitySummary[]>;
  queryClinicalRecords(options: NativeClinicalRecordQueryOptions): Promise<NativeClinicalRecord[]>;
  queryAudiograms(options: NativeDateRangeQueryOptions): Promise<NativeAudiogramSample[]>;
  queryWorkoutRoute(options: NativeWorkoutRouteQueryOptions): Promise<NativeWorkoutRoute[]>;
  queryCorrelations(options: NativeCorrelationQueryOptions): Promise<NativeCorrelation[]>;
  queryHeartbeatSeries(
    options: NativeHeartbeatSeriesQueryOptions
  ): Promise<NativeHeartbeatSeriesSample[]>;
  queryStatistics(options: NativeStatisticsQueryOptions): Promise<NativeStatistics>;
  queryStatisticsCollection(
    options: NativeStatisticsCollectionQueryOptions
  ): Promise<NativeStatistics[]>;
  queryAnchored(options: NativeAnchoredQueryOptions): Promise<NativeAnchoredQueryResult>;
  saveQuantitySample(sample: NativeQuantitySampleInput): Promise<string>;
  saveCategorySample(sample: NativeCategorySampleInput): Promise<string>;
  saveWorkout(workout: NativeWorkoutInput): Promise<string>;
  saveCorrelation(correlation: NativeCorrelationInput): Promise<string>;
  deleteObjects(options: NativeDeleteObjectsOptions): Promise<number>;
  getBiologicalSex(): Promise<number>;
  getBloodType(): Promise<number>;
  getDateOfBirth(): Promise<string | null>;
  getFitzpatrickSkinType(): Promise<number>;
  getWheelchairUse(): Promise<number>;
  enableBackgroundDelivery(type: string, frequency: number): Promise<boolean>;
  disableBackgroundDelivery(type: string): Promise<boolean>;
  disableAllBackgroundDelivery(): Promise<boolean>;
  observeTypes(types: string[]): Promise<void>;
  clearObserverQueries(): Promise<void>;
}

const nativeModule = requireNativeModule<ExpoHealthKitModule>('ExpoHealthKit');

function rethrowAsHealthKitError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : 'ERR_HEALTHKIT';
  const wrapped = new HealthKitError(message, code);
  if (__DEV__) {
    console.warn(`[expo-healthkit] ${code}: ${message}`);
  }
  throw wrapped;
}

export default new Proxy(nativeModule, {
  get(target, property, receiver) {
    const value = Reflect.get(target, property, receiver) as unknown;
    if (typeof value !== 'function') {
      return value;
    }
    return (...args: unknown[]) => {
      try {
        const result = (value as (...inner: unknown[]) => unknown).apply(target, args);
        if (result instanceof Promise) {
          return result.catch(rethrowAsHealthKitError);
        }
        return result;
      } catch (error) {
        rethrowAsHealthKitError(error);
      }
    };
  },
}) as ExpoHealthKitModule;
