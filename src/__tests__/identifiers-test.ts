import {
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
} from '../identifiers';

function values(record: Record<string, string>): string[] {
  return Object.values(record);
}

describe('HealthKit identifiers', () => {
  it('uses Apple raw identifier strings', () => {
    expect(QuantityType.stepCount).toBe('HKQuantityTypeIdentifierStepCount');
    expect(QuantityType.heartRate).toBe('HKQuantityTypeIdentifierHeartRate');
    expect(CategoryType.sleepAnalysis).toBe('HKCategoryTypeIdentifierSleepAnalysis');
    expect(CharacteristicType.biologicalSex).toBe('HKCharacteristicTypeIdentifierBiologicalSex');
    expect(CorrelationType.bloodPressure).toBe('HKCorrelationTypeIdentifierBloodPressure');
    expect(WorkoutType.workout).toBe('HKWorkoutTypeIdentifier');
    expect(ElectrocardiogramType.electrocardiogram).toBe('HKElectrocardiogramTypeIdentifier');
    expect(AudiogramType.audiogram).toBe('HKAudiogramSampleTypeIdentifier');
    expect(SeriesType.workoutRoute).toBe('HKWorkoutRouteTypeIdentifier');
    expect(SeriesType.heartbeat).toBe('HKDataTypeIdentifierHeartbeatSeries');
    expect(CorrelationType.food).toBe('HKCorrelationTypeIdentifierFood');
    expect(ActivitySummaryType.activitySummary).toBe('HKActivitySummaryTypeIdentifier');
    expect(ClinicalType.allergyRecord).toBe('HKClinicalTypeIdentifierAllergyRecord');
  });

  it('does not contain duplicate values', () => {
    const all = [
      ...values(QuantityType),
      ...values(CategoryType),
      ...values(CharacteristicType),
      ...values(CorrelationType),
      ...values(WorkoutType),
      ...values(ElectrocardiogramType),
      ...values(AudiogramType),
      ...values(SeriesType),
      ...values(ActivitySummaryType),
      ...values(ClinicalType),
    ];
    expect(new Set(all).size).toBe(all.length);
  });
});
