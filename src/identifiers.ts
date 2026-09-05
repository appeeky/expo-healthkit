/**
 * HealthKit type identifiers.
 *
 * Values match Apple's `HK*TypeIdentifier` raw strings so they can be passed
 * straight through to native APIs. Unknown identifiers are still accepted at
 * runtime if HealthKit recognizes them — add a constant here when you want
 * typed autocomplete.
 */

/* eslint-disable @typescript-eslint/no-redeclare */

export const QuantityType = {
  // Activity
  stepCount: 'HKQuantityTypeIdentifierStepCount',
  distanceWalkingRunning: 'HKQuantityTypeIdentifierDistanceWalkingRunning',
  distanceCycling: 'HKQuantityTypeIdentifierDistanceCycling',
  distanceSwimming: 'HKQuantityTypeIdentifierDistanceSwimming',
  distanceWheelchair: 'HKQuantityTypeIdentifierDistanceWheelchair',
  distanceDownhillSnowSports: 'HKQuantityTypeIdentifierDistanceDownhillSnowSports',
  basalEnergyBurned: 'HKQuantityTypeIdentifierBasalEnergyBurned',
  activeEnergyBurned: 'HKQuantityTypeIdentifierActiveEnergyBurned',
  flightsClimbed: 'HKQuantityTypeIdentifierFlightsClimbed',
  appleExerciseTime: 'HKQuantityTypeIdentifierAppleExerciseTime',
  appleMoveTime: 'HKQuantityTypeIdentifierAppleMoveTime',
  appleStandTime: 'HKQuantityTypeIdentifierAppleStandTime',
  nikeFuel: 'HKQuantityTypeIdentifierNikeFuel',
  pushCount: 'HKQuantityTypeIdentifierPushCount',
  swimmingStrokeCount: 'HKQuantityTypeIdentifierSwimmingStrokeCount',
  vo2Max: 'HKQuantityTypeIdentifierVO2Max',
  appleSleepingBreathingDisturbances: 'HKQuantityTypeIdentifierAppleSleepingBreathingDisturbances',
  physicalEffort: 'HKQuantityTypeIdentifierPhysicalEffort',
  estimatedWorkoutEffortScore: 'HKQuantityTypeIdentifierEstimatedWorkoutEffortScore',
  workoutEffortScore: 'HKQuantityTypeIdentifierWorkoutEffortScore',

  // Running / cycling
  runningStrideLength: 'HKQuantityTypeIdentifierRunningStrideLength',
  runningVerticalOscillation: 'HKQuantityTypeIdentifierRunningVerticalOscillation',
  runningGroundContactTime: 'HKQuantityTypeIdentifierRunningGroundContactTime',
  runningPower: 'HKQuantityTypeIdentifierRunningPower',
  runningSpeed: 'HKQuantityTypeIdentifierRunningSpeed',
  cyclingPower: 'HKQuantityTypeIdentifierCyclingPower',
  cyclingCadence: 'HKQuantityTypeIdentifierCyclingCadence',
  cyclingFunctionalThresholdPower: 'HKQuantityTypeIdentifierCyclingFunctionalThresholdPower',
  cyclingSpeed: 'HKQuantityTypeIdentifierCyclingSpeed',

  // Vitals
  heartRate: 'HKQuantityTypeIdentifierHeartRate',
  restingHeartRate: 'HKQuantityTypeIdentifierRestingHeartRate',
  walkingHeartRateAverage: 'HKQuantityTypeIdentifierWalkingHeartRateAverage',
  heartRateVariabilitySDNN: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  heartRateRecoveryOneMinute: 'HKQuantityTypeIdentifierHeartRateRecoveryOneMinute',
  atrialFibrillationBurden: 'HKQuantityTypeIdentifierAtrialFibrillationBurden',
  oxygenSaturation: 'HKQuantityTypeIdentifierOxygenSaturation',
  peripheralPerfusionIndex: 'HKQuantityTypeIdentifierPeripheralPerfusionIndex',
  respiratoryRate: 'HKQuantityTypeIdentifierRespiratoryRate',
  bodyTemperature: 'HKQuantityTypeIdentifierBodyTemperature',
  basalBodyTemperature: 'HKQuantityTypeIdentifierBasalBodyTemperature',
  bloodPressureSystolic: 'HKQuantityTypeIdentifierBloodPressureSystolic',
  bloodPressureDiastolic: 'HKQuantityTypeIdentifierBloodPressureDiastolic',
  bloodGlucose: 'HKQuantityTypeIdentifierBloodGlucose',
  bloodAlcoholContent: 'HKQuantityTypeIdentifierBloodAlcoholContent',
  electrodermalActivity: 'HKQuantityTypeIdentifierElectrodermalActivity',
  insulinDelivery: 'HKQuantityTypeIdentifierInsulinDelivery',
  numberOfTimesFallen: 'HKQuantityTypeIdentifierNumberOfTimesFallen',
  inhalerUsage: 'HKQuantityTypeIdentifierInhalerUsage',
  forcedVitalCapacity: 'HKQuantityTypeIdentifierForcedVitalCapacity',
  forcedExpiratoryVolume1: 'HKQuantityTypeIdentifierForcedExpiratoryVolume1',
  peakExpiratoryFlowRate: 'HKQuantityTypeIdentifierPeakExpiratoryFlowRate',

  // Body
  height: 'HKQuantityTypeIdentifierHeight',
  bodyMass: 'HKQuantityTypeIdentifierBodyMass',
  bodyMassIndex: 'HKQuantityTypeIdentifierBodyMassIndex',
  leanBodyMass: 'HKQuantityTypeIdentifierLeanBodyMass',
  bodyFatPercentage: 'HKQuantityTypeIdentifierBodyFatPercentage',
  waistCircumference: 'HKQuantityTypeIdentifierWaistCircumference',
  appleSleepingWristTemperature: 'HKQuantityTypeIdentifierAppleSleepingWristTemperature',

  // Mobility
  sixMinuteWalkTestDistance: 'HKQuantityTypeIdentifierSixMinuteWalkTestDistance',
  walkingSpeed: 'HKQuantityTypeIdentifierWalkingSpeed',
  walkingStepLength: 'HKQuantityTypeIdentifierWalkingStepLength',
  walkingAsymmetryPercentage: 'HKQuantityTypeIdentifierWalkingAsymmetryPercentage',
  walkingDoubleSupportPercentage: 'HKQuantityTypeIdentifierWalkingDoubleSupportPercentage',
  stairAscentSpeed: 'HKQuantityTypeIdentifierStairAscentSpeed',
  stairDescentSpeed: 'HKQuantityTypeIdentifierStairDescentSpeed',
  appleWalkingSteadiness: 'HKQuantityTypeIdentifierAppleWalkingSteadiness',

  // Hearing
  environmentalAudioExposure: 'HKQuantityTypeIdentifierEnvironmentalAudioExposure',
  headphoneAudioExposure: 'HKQuantityTypeIdentifierHeadphoneAudioExposure',

  // Nutrition
  dietaryEnergyConsumed: 'HKQuantityTypeIdentifierDietaryEnergyConsumed',
  dietaryWater: 'HKQuantityTypeIdentifierDietaryWater',
  dietaryCarbohydrates: 'HKQuantityTypeIdentifierDietaryCarbohydrates',
  dietaryProtein: 'HKQuantityTypeIdentifierDietaryProtein',
  dietaryFatTotal: 'HKQuantityTypeIdentifierDietaryFatTotal',
  dietaryFatSaturated: 'HKQuantityTypeIdentifierDietaryFatSaturated',
  dietaryFatMonounsaturated: 'HKQuantityTypeIdentifierDietaryFatMonounsaturated',
  dietaryFatPolyunsaturated: 'HKQuantityTypeIdentifierDietaryFatPolyunsaturated',
  dietaryCholesterol: 'HKQuantityTypeIdentifierDietaryCholesterol',
  dietarySodium: 'HKQuantityTypeIdentifierDietarySodium',
  dietarySugar: 'HKQuantityTypeIdentifierDietarySugar',
  dietaryFiber: 'HKQuantityTypeIdentifierDietaryFiber',
  dietaryCaffeine: 'HKQuantityTypeIdentifierDietaryCaffeine',
  dietaryCalcium: 'HKQuantityTypeIdentifierDietaryCalcium',
  dietaryIron: 'HKQuantityTypeIdentifierDietaryIron',
  dietaryPotassium: 'HKQuantityTypeIdentifierDietaryPotassium',
  dietaryVitaminA: 'HKQuantityTypeIdentifierDietaryVitaminA',
  dietaryVitaminC: 'HKQuantityTypeIdentifierDietaryVitaminC',
  dietaryVitaminD: 'HKQuantityTypeIdentifierDietaryVitaminD',
  dietaryVitaminE: 'HKQuantityTypeIdentifierDietaryVitaminE',
  dietaryVitaminK: 'HKQuantityTypeIdentifierDietaryVitaminK',
  dietaryVitaminB6: 'HKQuantityTypeIdentifierDietaryVitaminB6',
  dietaryVitaminB12: 'HKQuantityTypeIdentifierDietaryVitaminB12',
  dietaryBiotin: 'HKQuantityTypeIdentifierDietaryBiotin',
  dietaryFolate: 'HKQuantityTypeIdentifierDietaryFolate',
  dietaryNiacin: 'HKQuantityTypeIdentifierDietaryNiacin',
  dietaryPantothenicAcid: 'HKQuantityTypeIdentifierDietaryPantothenicAcid',
  dietaryRiboflavin: 'HKQuantityTypeIdentifierDietaryRiboflavin',
  dietaryThiamin: 'HKQuantityTypeIdentifierDietaryThiamin',
  dietaryMagnesium: 'HKQuantityTypeIdentifierDietaryMagnesium',
  dietaryManganese: 'HKQuantityTypeIdentifierDietaryManganese',
  dietaryPhosphorus: 'HKQuantityTypeIdentifierDietaryPhosphorus',
  dietarySelenium: 'HKQuantityTypeIdentifierDietarySelenium',
  dietaryZinc: 'HKQuantityTypeIdentifierDietaryZinc',
  dietaryIodine: 'HKQuantityTypeIdentifierDietaryIodine',
  dietaryChromium: 'HKQuantityTypeIdentifierDietaryChromium',
  dietaryCopper: 'HKQuantityTypeIdentifierDietaryCopper',
  dietaryMolybdenum: 'HKQuantityTypeIdentifierDietaryMolybdenum',
  dietaryChloride: 'HKQuantityTypeIdentifierDietaryChloride',
} as const;

export type QuantityType = (typeof QuantityType)[keyof typeof QuantityType];

export const CategoryType = {
  sleepAnalysis: 'HKCategoryTypeIdentifierSleepAnalysis',
  appleStandHour: 'HKCategoryTypeIdentifierAppleStandHour',
  cervicalMucusQuality: 'HKCategoryTypeIdentifierCervicalMucusQuality',
  ovulationTestResult: 'HKCategoryTypeIdentifierOvulationTestResult',
  menstrualFlow: 'HKCategoryTypeIdentifierMenstrualFlow',
  intermenstrualBleeding: 'HKCategoryTypeIdentifierIntermenstrualBleeding',
  sexualActivity: 'HKCategoryTypeIdentifierSexualActivity',
  mindfulSession: 'HKCategoryTypeIdentifierMindfulSession',
  highHeartRateEvent: 'HKCategoryTypeIdentifierHighHeartRateEvent',
  lowHeartRateEvent: 'HKCategoryTypeIdentifierLowHeartRateEvent',
  irregularHeartRhythmEvent: 'HKCategoryTypeIdentifierIrregularHeartRhythmEvent',
  toothbrushingEvent: 'HKCategoryTypeIdentifierToothbrushingEvent',
  pregnancy: 'HKCategoryTypeIdentifierPregnancy',
  lactation: 'HKCategoryTypeIdentifierLactation',
  contraceptive: 'HKCategoryTypeIdentifierContraceptive',
  audioExposureEvent: 'HKCategoryTypeIdentifierAudioExposureEvent',
  environmentalAudioExposureEvent: 'HKCategoryTypeIdentifierEnvironmentalAudioExposureEvent',
  headphoneAudioExposureEvent: 'HKCategoryTypeIdentifierHeadphoneAudioExposureEvent',
  appleWalkingSteadinessEvent: 'HKCategoryTypeIdentifierAppleWalkingSteadinessEvent',
  lowCardioFitnessEvent: 'HKCategoryTypeIdentifierLowCardioFitnessEvent',
  handwashingEvent: 'HKCategoryTypeIdentifierHandwashingEvent',
  pregnancyTestResult: 'HKCategoryTypeIdentifierPregnancyTestResult',
  progesteroneTestResult: 'HKCategoryTypeIdentifierProgesteroneTestResult',
} as const;

export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

export const CharacteristicType = {
  biologicalSex: 'HKCharacteristicTypeIdentifierBiologicalSex',
  bloodType: 'HKCharacteristicTypeIdentifierBloodType',
  dateOfBirth: 'HKCharacteristicTypeIdentifierDateOfBirth',
  fitzpatrickSkinType: 'HKCharacteristicTypeIdentifierFitzpatrickSkinType',
  wheelchairUse: 'HKCharacteristicTypeIdentifierWheelchairUse',
  activityMoveMode: 'HKCharacteristicTypeIdentifierActivityMoveMode',
} as const;

export type CharacteristicType = (typeof CharacteristicType)[keyof typeof CharacteristicType];

export const CorrelationType = {
  bloodPressure: 'HKCorrelationTypeIdentifierBloodPressure',
  food: 'HKCorrelationTypeIdentifierFood',
} as const;

export type CorrelationType = (typeof CorrelationType)[keyof typeof CorrelationType];

export const WorkoutType = {
  workout: 'HKWorkoutTypeIdentifier',
} as const;

export type WorkoutType = (typeof WorkoutType)[keyof typeof WorkoutType];

export const ElectrocardiogramType = {
  electrocardiogram: 'HKElectrocardiogramTypeIdentifier',
} as const;

export type ElectrocardiogramType =
  (typeof ElectrocardiogramType)[keyof typeof ElectrocardiogramType];

export const AudiogramType = {
  audiogram: 'HKAudiogramSampleTypeIdentifier',
} as const;

export type AudiogramType = (typeof AudiogramType)[keyof typeof AudiogramType];

export const SeriesType = {
  workoutRoute: 'HKWorkoutRouteTypeIdentifier',
  heartbeat: 'HKDataTypeIdentifierHeartbeatSeries',
} as const;

export type SeriesType = (typeof SeriesType)[keyof typeof SeriesType];

export const ActivitySummaryType = {
  activitySummary: 'HKActivitySummaryTypeIdentifier',
} as const;

export type ActivitySummaryType = (typeof ActivitySummaryType)[keyof typeof ActivitySummaryType];

export const ClinicalType = {
  allergyRecord: 'HKClinicalTypeIdentifierAllergyRecord',
  conditionRecord: 'HKClinicalTypeIdentifierConditionRecord',
  immunizationRecord: 'HKClinicalTypeIdentifierImmunizationRecord',
  labResultRecord: 'HKClinicalTypeIdentifierLabResultRecord',
  medicationRecord: 'HKClinicalTypeIdentifierMedicationRecord',
  procedureRecord: 'HKClinicalTypeIdentifierProcedureRecord',
  vitalSignRecord: 'HKClinicalTypeIdentifierVitalSignRecord',
  coverageRecord: 'HKClinicalTypeIdentifierCoverageRecord',
} as const;

export type ClinicalType = (typeof ClinicalType)[keyof typeof ClinicalType];

export type ObjectType =
  | QuantityType
  | CategoryType
  | CharacteristicType
  | CorrelationType
  | WorkoutType
  | ElectrocardiogramType
  | AudiogramType
  | SeriesType
  | ActivitySummaryType
  | ClinicalType
  | (string & {});

export const Unit = {
  count: 'count',
  countPerMinute: 'count/min',
  countPerSecond: 'count/s',
  percent: '%',
  kilogram: 'kg',
  gram: 'g',
  milligram: 'mg',
  pound: 'lb',
  meter: 'm',
  kilometer: 'km',
  centimeter: 'cm',
  mile: 'mi',
  foot: 'ft',
  inch: 'in',
  meterPerSecond: 'm/s',
  kilometerPerHour: 'km/hr',
  milePerHour: 'mi/hr',
  kilocalorie: 'kcal',
  joule: 'J',
  degreeCelsius: 'degC',
  degreeFahrenheit: 'degF',
  millimeterOfMercury: 'mmHg',
  milliliter: 'mL',
  liter: 'L',
  milligramPerDeciliter: 'mg/dL',
  millimolePerLiter: 'mmol<mol>/L',
  second: 's',
  minute: 'min',
  hour: 'hr',
  watt: 'W',
  decibelAWeightedSoundPressureLevel: 'dBASPL',
  hertz: 'Hz',
  decibelHearingLevel: 'dBHL',
  volt: 'V',
  microvolt: 'uV',
} as const;

export type Unit = (typeof Unit)[keyof typeof Unit];

/** Matches `HKWorkoutActivityType` raw values. */
export const WorkoutActivityType = {
  americanFootball: 1,
  archery: 2,
  australianFootball: 3,
  badminton: 4,
  baseball: 5,
  basketball: 6,
  bowling: 7,
  boxing: 8,
  climbing: 9,
  cricket: 10,
  crossTraining: 11,
  curling: 12,
  cycling: 13,
  dance: 14,
  danceInspiredTraining: 15,
  elliptical: 16,
  equestrianSports: 17,
  fencing: 18,
  fishing: 19,
  functionalStrengthTraining: 20,
  golf: 21,
  gymnastics: 22,
  handball: 23,
  hiking: 24,
  hockey: 25,
  hunting: 26,
  lacrosse: 27,
  martialArts: 28,
  mindAndBody: 29,
  mixedMetabolicCardioTraining: 30,
  paddleSports: 31,
  play: 32,
  preparationAndRecovery: 33,
  racquetball: 34,
  rowing: 35,
  rugby: 36,
  running: 37,
  sailing: 38,
  skatingSports: 39,
  snowSports: 40,
  soccer: 41,
  softball: 42,
  squash: 43,
  stairClimbing: 44,
  surfingSports: 45,
  swimming: 46,
  tableTennis: 47,
  tennis: 48,
  trackAndField: 49,
  traditionalStrengthTraining: 50,
  volleyball: 51,
  walking: 52,
  waterFitness: 53,
  waterPolo: 54,
  waterSports: 55,
  wrestling: 56,
  yoga: 57,
  barre: 58,
  coreTraining: 59,
  crossCountrySkiing: 60,
  downhillSkiing: 61,
  flexibility: 62,
  highIntensityIntervalTraining: 63,
  jumpRope: 64,
  kickboxing: 65,
  pilates: 66,
  snowboarding: 67,
  stairs: 68,
  stepTraining: 69,
  wheelchairWalkPace: 70,
  wheelchairRunPace: 71,
  taiChi: 72,
  mixedCardio: 73,
  handCycling: 74,
  discSports: 75,
  fitnessGaming: 76,
  cardioDance: 77,
  socialDance: 78,
  pickleball: 79,
  cooldown: 80,
  swimBikeRun: 82,
  transition: 83,
  underwaterDiving: 84,
  other: 3000,
} as const;

export type WorkoutActivityType = (typeof WorkoutActivityType)[keyof typeof WorkoutActivityType];

/** Matches `HKCategoryValueSleepAnalysis`. */
export const SleepAnalysisValue = {
  inBed: 0,
  asleepUnspecified: 1,
  awake: 2,
  asleepCore: 3,
  asleepDeep: 4,
  asleepREM: 5,
} as const;

export type SleepAnalysisValue = (typeof SleepAnalysisValue)[keyof typeof SleepAnalysisValue];

/** Matches `HKUpdateFrequency`. */
export const UpdateFrequency = {
  immediate: 1,
  hourly: 2,
  daily: 3,
  weekly: 4,
} as const;

export type UpdateFrequency = (typeof UpdateFrequency)[keyof typeof UpdateFrequency];

/** Matches `HKStatisticsOptions` bitmask values used by this module. */
export const StatisticsOption = {
  none: 0,
  discreteAverage: 1,
  discreteMin: 2,
  discreteMax: 4,
  cumulativeSum: 8,
  discreteMostRecent: 32,
} as const;

export type StatisticsOption = (typeof StatisticsOption)[keyof typeof StatisticsOption];

/** Matches `HKAuthorizationStatus`. */
export const AuthorizationStatus = {
  notDetermined: 0,
  sharingDenied: 1,
  sharingAuthorized: 2,
} as const;

export type AuthorizationStatus = (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];

/** Matches `HKAuthorizationRequestStatus`. */
export const AuthorizationRequestStatus = {
  unknown: 0,
  shouldRequest: 1,
  unnecessary: 2,
} as const;

export type AuthorizationRequestStatus =
  (typeof AuthorizationRequestStatus)[keyof typeof AuthorizationRequestStatus];

/** Matches `HKBiologicalSex`. */
export const BiologicalSex = {
  notSet: 0,
  female: 1,
  male: 2,
  other: 3,
} as const;

export type BiologicalSex = (typeof BiologicalSex)[keyof typeof BiologicalSex];

/** Matches `HKBloodType`. */
export const BloodType = {
  notSet: 0,
  aPositive: 1,
  aNegative: 2,
  bPositive: 3,
  bNegative: 4,
  abPositive: 5,
  abNegative: 6,
  oPositive: 7,
  oNegative: 8,
} as const;

export type BloodType = (typeof BloodType)[keyof typeof BloodType];

/** Matches `HKFitzpatrickSkinType`. */
export const FitzpatrickSkinType = {
  notSet: 0,
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
} as const;

export type FitzpatrickSkinType = (typeof FitzpatrickSkinType)[keyof typeof FitzpatrickSkinType];

/** Matches `HKWheelchairUse`. */
export const WheelchairUse = {
  notSet: 0,
  no: 1,
  yes: 2,
} as const;

export type WheelchairUse = (typeof WheelchairUse)[keyof typeof WheelchairUse];

/** Matches `HKElectrocardiogram.Classification`. */
export const ElectrocardiogramClassification = {
  notSet: 0,
  sinusRhythm: 1,
  atrialFibrillation: 2,
  inconclusiveLowHeartRate: 3,
  inconclusiveHighHeartRate: 4,
  inconclusivePoorReading: 5,
  inconclusiveOther: 6,
  unrecognized: 100,
} as const;

export type ElectrocardiogramClassification =
  (typeof ElectrocardiogramClassification)[keyof typeof ElectrocardiogramClassification];

/** Matches `HKElectrocardiogram.SymptomsStatus`. */
export const ElectrocardiogramSymptomsStatus = {
  notSet: 0,
  none: 1,
  present: 2,
} as const;

export type ElectrocardiogramSymptomsStatus =
  (typeof ElectrocardiogramSymptomsStatus)[keyof typeof ElectrocardiogramSymptomsStatus];
