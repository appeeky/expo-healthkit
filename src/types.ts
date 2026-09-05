import type {
  ClinicalType,
  CorrelationType,
  ElectrocardiogramClassification,
  ElectrocardiogramSymptomsStatus,
  ObjectType,
  WorkoutActivityType,
} from './identifiers';

export type DateInput = Date | string;

export interface AuthorizationOptions {
  toRead?: readonly ObjectType[];
  toShare?: readonly ObjectType[];
}

export interface SampleQueryOptions {
  type: ObjectType;
  from?: DateInput;
  to?: DateInput;
  limit?: number;
  ascending?: boolean;
}

export interface QuantityQueryOptions extends SampleQueryOptions {
  unit: string;
}

export interface WorkoutQueryOptions {
  from?: DateInput;
  to?: DateInput;
  limit?: number;
  ascending?: boolean;
  activityType?: WorkoutActivityType;
}

export interface StatisticsQueryOptions {
  type: ObjectType;
  unit: string;
  from?: DateInput;
  to?: DateInput;
  /** Bitmask of `StatisticsOption` values. Combine with bitwise OR. */
  options?: number;
}

export interface DateInterval {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
}

export interface StatisticsCollectionQueryOptions extends StatisticsQueryOptions {
  interval?: DateInterval;
}

export interface AnchoredQueryOptions extends SampleQueryOptions {
  unit?: string;
  /** Opaque token returned by a previous anchored query. */
  anchor?: string | null;
}

export interface QuantitySampleInput {
  type: ObjectType;
  unit: string;
  value: number;
  startDate: DateInput;
  endDate?: DateInput;
  metadata?: Record<string, string>;
}

export interface CategorySampleInput {
  type: ObjectType;
  value: number;
  startDate: DateInput;
  endDate?: DateInput;
  metadata?: Record<string, string>;
}

export interface WorkoutInput {
  activityType: WorkoutActivityType;
  startDate: DateInput;
  endDate: DateInput;
  energyBurned?: number;
  energyBurnedUnit?: string;
  distance?: number;
  distanceUnit?: string;
  metadata?: Record<string, string>;
}

export interface DeleteObjectsOptions {
  uuid?: string;
  type?: ObjectType;
  from?: DateInput;
  to?: DateInput;
}

export interface DateRangeQueryOptions {
  from?: DateInput;
  to?: DateInput;
  limit?: number;
  ascending?: boolean;
}

export interface ElectrocardiogramQueryOptions extends DateRangeQueryOptions {
  includeVoltage?: boolean;
}

export interface ActivitySummaryQueryOptions {
  from?: DateInput;
  to?: DateInput;
}

export interface ClinicalRecordQueryOptions extends DateRangeQueryOptions {
  type: ClinicalType | (string & {});
}

export interface WorkoutRouteQueryOptions {
  workoutUUID: string;
}

export interface CorrelationQueryOptions extends DateRangeQueryOptions {
  type: CorrelationType | (string & {});
}

export interface CorrelationObjectInput {
  type: ObjectType;
  unit: string;
  value: number;
  startDate?: DateInput;
  endDate?: DateInput;
  metadata?: Record<string, string>;
}

export interface CorrelationInput {
  type: CorrelationType | (string & {});
  startDate: DateInput;
  endDate?: DateInput;
  objects: readonly CorrelationObjectInput[];
  metadata?: Record<string, string>;
}

export interface HeartbeatSeriesQueryOptions extends DateRangeQueryOptions {
  /** Default `true`. `false` returns series metadata without beat timestamps. */
  includeBeats?: boolean;
}

export interface Correlation {
  uuid: string;
  type: string;
  startDate: Date;
  endDate: Date;
  objects: QuantitySample[];
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface Heartbeat {
  timeSinceSeriesStart: number;
  precededByGap: boolean;
}

export interface HeartbeatSeriesSample {
  uuid: string;
  type: string;
  startDate: Date;
  endDate: Date;
  count: number;
  beats?: Heartbeat[];
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface QuantitySample {
  uuid: string;
  type: string;
  startDate: Date;
  endDate: Date;
  value: number;
  unit: string;
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface CategorySample {
  uuid: string;
  type: string;
  startDate: Date;
  endDate: Date;
  value: number;
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface WorkoutSample {
  uuid: string;
  type: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  workoutActivityType: WorkoutActivityType;
  totalEnergyBurned?: number;
  totalEnergyBurnedUnit?: string;
  totalDistance?: number;
  totalDistanceUnit?: string;
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface ElectrocardiogramVoltageMeasurement {
  timeSinceSampleStart: number;
  voltage: number;
  unit: string;
}

export interface ElectrocardiogramSample {
  uuid: string;
  type: string;
  startDate: Date;
  endDate: Date;
  classification: ElectrocardiogramClassification;
  symptomsStatus: ElectrocardiogramSymptomsStatus;
  averageHeartRate?: number;
  samplingFrequency?: number;
  numberOfVoltageMeasurements: number;
  voltageMeasurements?: ElectrocardiogramVoltageMeasurement[];
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface AudiogramSensitivityPoint {
  frequency: number;
  leftEarSensitivity?: number;
  rightEarSensitivity?: number;
}

export interface AudiogramSample {
  uuid: string;
  type: string;
  startDate: Date;
  endDate: Date;
  sensitivityPoints: AudiogramSensitivityPoint[];
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface ActivitySummary {
  date: string;
  activeEnergyBurned: number;
  appleExerciseTime: number;
  appleStandHours: number;
  activeEnergyBurnedGoal: number;
  appleExerciseTimeGoal: number;
  appleStandHoursGoal: number;
  appleMoveTime?: number;
  appleMoveTimeGoal?: number;
}

export interface ClinicalRecord {
  uuid: string;
  type: string;
  startDate: Date;
  endDate: Date;
  displayName: string;
  fhirResourceType?: string;
  fhirJson?: string;
  sourceName?: string;
  sourceId?: string;
}

export interface WorkoutRouteLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: Date;
  speed?: number;
  course?: number;
}

export interface WorkoutRoute {
  uuid: string;
  type: string;
  startDate: Date;
  endDate: Date;
  locations: WorkoutRouteLocation[];
}

export interface DeletedSample {
  uuid: string;
  type?: string;
}

export interface Statistics {
  startDate: Date;
  endDate: Date;
  unit: string;
  sum?: number;
  min?: number;
  max?: number;
  average?: number;
  mostRecent?: number;
}

export interface AnchoredQueryResult {
  added: QuantitySample[];
  deleted: DeletedSample[];
  anchor: string | null;
}

export interface HealthUpdateEvent {
  type: string;
}

export type ExpoHealthKitModuleEvents = {
  onUpdate: (event: HealthUpdateEvent) => void;
};

export interface NativeAuthorizationOptions {
  toRead: string[];
  toShare: string[];
}

export interface NativeQuantityQueryOptions {
  type: string;
  unit: string;
  from?: string;
  to?: string;
  limit: number;
  ascending: boolean;
}

export interface NativeCategoryQueryOptions {
  type: string;
  from?: string;
  to?: string;
  limit: number;
  ascending: boolean;
}

export interface NativeWorkoutQueryOptions {
  from?: string;
  to?: string;
  limit: number;
  ascending: boolean;
  activityType?: number;
}

export interface NativeStatisticsQueryOptions {
  type: string;
  unit: string;
  from?: string;
  to?: string;
  options: number;
}

export interface NativeStatisticsCollectionQueryOptions extends NativeStatisticsQueryOptions {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface NativeAnchoredQueryOptions {
  type: string;
  unit?: string;
  from?: string;
  to?: string;
  limit: number;
  anchor?: string;
}

export interface NativeQuantitySampleInput {
  type: string;
  unit: string;
  value: number;
  startDate: string;
  endDate: string;
  metadata?: Record<string, string>;
}

export interface NativeCategorySampleInput {
  type: string;
  value: number;
  startDate: string;
  endDate: string;
  metadata?: Record<string, string>;
}

export interface NativeWorkoutInput {
  activityType: number;
  startDate: string;
  endDate: string;
  energyBurned?: number;
  energyBurnedUnit?: string;
  distance?: number;
  distanceUnit?: string;
  metadata?: Record<string, string>;
}

export interface NativeDeleteObjectsOptions {
  uuid?: string;
  type?: string;
  from?: string;
  to?: string;
}

export interface NativeQuantitySample {
  uuid: string;
  type: string;
  startDate: string;
  endDate: string;
  value: number;
  unit: string;
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface NativeCategorySample {
  uuid: string;
  type: string;
  startDate: string;
  endDate: string;
  value: number;
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface NativeWorkoutSample {
  uuid: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  workoutActivityType: number;
  totalEnergyBurned?: number;
  totalEnergyBurnedUnit?: string;
  totalDistance?: number;
  totalDistanceUnit?: string;
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface NativeDeletedSample {
  uuid: string;
  type?: string;
}

export interface NativeStatistics {
  startDate: string;
  endDate: string;
  unit: string;
  sum?: number;
  min?: number;
  max?: number;
  average?: number;
  mostRecent?: number;
}

export interface NativeAnchoredQueryResult {
  added: NativeQuantitySample[];
  deleted: NativeDeletedSample[];
  anchor?: string;
}

export interface NativeDateRangeQueryOptions {
  from?: string;
  to?: string;
  limit: number;
  ascending: boolean;
}

export interface NativeElectrocardiogramQueryOptions extends NativeDateRangeQueryOptions {
  includeVoltage: boolean;
}

export interface NativeActivitySummaryQueryOptions {
  from?: string;
  to?: string;
}

export interface NativeClinicalRecordQueryOptions extends NativeDateRangeQueryOptions {
  type: string;
}

export interface NativeWorkoutRouteQueryOptions {
  workoutUUID: string;
}

export interface NativeElectrocardiogramVoltageMeasurement {
  timeSinceSampleStart: number;
  voltage: number;
  unit: string;
}

export interface NativeElectrocardiogramSample {
  uuid: string;
  type: string;
  startDate: string;
  endDate: string;
  classification: number;
  symptomsStatus: number;
  averageHeartRate?: number;
  samplingFrequency?: number;
  numberOfVoltageMeasurements: number;
  voltageMeasurements?: NativeElectrocardiogramVoltageMeasurement[];
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface NativeAudiogramSensitivityPoint {
  frequency: number;
  leftEarSensitivity?: number;
  rightEarSensitivity?: number;
}

export interface NativeAudiogramSample {
  uuid: string;
  type: string;
  startDate: string;
  endDate: string;
  sensitivityPoints: NativeAudiogramSensitivityPoint[];
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface NativeActivitySummary {
  date: string;
  activeEnergyBurned: number;
  appleExerciseTime: number;
  appleStandHours: number;
  activeEnergyBurnedGoal: number;
  appleExerciseTimeGoal: number;
  appleStandHoursGoal: number;
  appleMoveTime?: number;
  appleMoveTimeGoal?: number;
}

export interface NativeClinicalRecord {
  uuid: string;
  type: string;
  startDate: string;
  endDate: string;
  displayName: string;
  fhirResourceType?: string;
  fhirJson?: string;
  sourceName?: string;
  sourceId?: string;
}

export interface NativeWorkoutRouteLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: string;
  speed?: number;
  course?: number;
}

export interface NativeWorkoutRoute {
  uuid: string;
  type: string;
  startDate: string;
  endDate: string;
  locations: NativeWorkoutRouteLocation[];
}

export interface NativeCorrelationQueryOptions extends NativeDateRangeQueryOptions {
  type: string;
}

export interface NativeCorrelationInput {
  type: string;
  startDate: string;
  endDate: string;
  objects: NativeQuantitySampleInput[];
  metadata?: Record<string, string>;
}

export interface NativeHeartbeatSeriesQueryOptions extends NativeDateRangeQueryOptions {
  includeBeats: boolean;
}

export interface NativeCorrelation {
  uuid: string;
  type: string;
  startDate: string;
  endDate: string;
  objects: NativeQuantitySample[];
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}

export interface NativeHeartbeat {
  timeSinceSeriesStart: number;
  precededByGap: boolean;
}

export interface NativeHeartbeatSeriesSample {
  uuid: string;
  type: string;
  startDate: string;
  endDate: string;
  count: number;
  beats?: NativeHeartbeat[];
  sourceName?: string;
  sourceId?: string;
  metadata?: Record<string, string>;
}
