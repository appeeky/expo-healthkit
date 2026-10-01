# expo-healthkit reference

Canonical implementations: `src/index.ts`, `src/types.ts`, `src/identifiers.ts`. iOS talks to HealthKit; Android maps the same Apple identifiers onto Health Connect.

## Plugin

| Prop | Default | Effect |
| --- | --- | --- |
| `healthSharePermission` | share usage string | `NSHealthShareUsageDescription`. `false` skips the key |
| `healthUpdatePermission` | update usage string | `NSHealthUpdateUsageDescription`. `false` skips the key |
| `healthClinicalRecordsPermission` | clinical usage string | Used when `isClinicalDataEnabled` |
| `isBackgroundDeliveryEnabled` | `false` | HealthKit background-delivery entitlement |
| `isClinicalDataEnabled` | `false` | `com.apple.developer.healthkit.access = ["health-records"]` |
| `healthConnectPrivacyPolicyUrl` | — | Health Connect rationale activity metadata |
| `healthConnectPermissions` | all mapped permissions | `uses-permission` entries to declare, `READ_STEPS` or `android.permission.health.READ_STEPS`. When set, only these |
| `isHealthConnectBackgroundReadEnabled` | `false` | Declares `READ_HEALTH_DATA_IN_BACKGROUND` |

The plugin always sets `com.apple.developer.healthkit = true`. The App ID still needs the HealthKit capability. On Android the plugin is the only place Health Connect `uses-permission` entries are declared (the module manifest declares none) and it raises `android.minSdkVersion` to 26 when it is lower.

Min iOS: 16.4. Android: Health Connect (`connect-client` 1.1), API 26+.

## Availability and auth

```ts
isAvailable(): boolean
getSupportedTypes(): readonly string[]                       // static; [] on web
getUnsupportedTypes(identifiers): string[]                   // the ones this platform cannot provide
requestAuthorization({ toRead?, toShare?, includeBackgroundRead? }): Promise<boolean>
getAuthorizationStatus(type): Promise<number> // AuthorizationStatus; write only
getRequestStatusForAuthorization({ toRead?, toShare? }): Promise<number> // AuthorizationRequestStatus
getGrantedPermissions(): Promise<readonly string[]>          // Android: raw permission strings; iOS: write-authorized identifiers
requestPermissions(permissions): Promise<readonly string[]>  // Android only; iOS throws ERR_HEALTHKIT_UNSUPPORTED
revokeAllPermissions(): Promise<void>                        // Android only; iOS throws ERR_HEALTHKIT_UNSUPPORTED
```

`AuthorizationStatus`: `notDetermined` 0, `sharingDenied` 1, `sharingAuthorized` 2.

`AuthorizationRequestStatus`: `unknown` 0, `shouldRequest` 1, `unnecessary` 2.

## Quantity / category / workout

```ts
queryQuantitySamples({ type, unit, from?, to?, limit?, ascending?, sources?, excludeSources? }): Promise<QuantitySample[]>
queryCategorySamples({ type, from?, to?, limit?, ascending?, sources?, excludeSources? }): Promise<CategorySample[]>
queryWorkouts({ from?, to?, limit?, ascending?, activityType?, sources?, excludeSources? }): Promise<WorkoutSample[]>
queryStatistics({ type, unit, from?, to?, options?, sources?, excludeSources? }): Promise<Statistics>
queryStatisticsCollection({ type, unit, from?, to?, options?, interval?, sources?, excludeSources? }): Promise<Statistics[]>
queryAnchored({ type, unit?, from?, to?, limit?, anchor?, sources?, excludeSources? }): Promise<AnchoredQueryResult>
```

`sources` / `excludeSources`: bundle ids (iOS) or package names (Android); `'self'` is this app. Applied natively before `limit`. Android statistics support `sources` only (`excludeSources` throws `ERR_HEALTH_CONNECT_UNSUPPORTED`). The specialized reads below take the same two options.

`QuantitySample`: `uuid`, `type`, `startDate`, `endDate`, `value`, `unit`, `sourceName?`, `sourceId?`, `metadata?`, `statistic?` (`'sdnn'` iOS / `'rmssd'` Android, on `heartRateVariabilitySDNN` only).

`CategorySample`: same without `unit`; `value` is the category enum int.

`WorkoutSample`: plus `duration`, `workoutActivityType`, optional `totalEnergyBurned` / `totalDistance` and their units.

`Statistics`: `startDate`, `endDate`, `unit`, optional `sum`, `min`, `max`, `average`, `mostRecent`.

`AnchoredQueryResult`: `{ added, deleted, anchor }`. Persist `anchor` and pass it back. It is opaque and per-platform, not a timestamp; a token from another library or an expired Android changes token (30 days) restarts the sync instead of erroring.

`StatisticsOption` bitmask: `discreteAverage` 1, `discreteMin` 2, `discreteMax` 4, `cumulativeSum` 8, `discreteMostRecent` 32.

Native default when `options` is 0: cumulative types → sum; discrete types → average.

## Specialized reads

```ts
queryElectrocardiograms({ from?, to?, limit?, ascending?, includeVoltage? }): Promise<ElectrocardiogramSample[]>
queryActivitySummaries({ from?, to? }): Promise<ActivitySummary[]>
queryClinicalRecords({ type, from?, to?, limit?, ascending? }): Promise<ClinicalRecord[]>
queryAudiograms({ from?, to?, limit?, ascending? }): Promise<AudiogramSample[]>
queryWorkoutRoute({ workoutUUID }): Promise<WorkoutRoute[]>
queryCorrelations({ type, from?, to?, limit?, ascending? }): Promise<Correlation[]>
queryHeartbeatSeries({ from?, to?, limit?, ascending?, includeBeats? }): Promise<HeartbeatSeriesSample[]>
```

ECG: `classification` (`ElectrocardiogramClassification`), `symptomsStatus`, `averageHeartRate` (count/min), `samplingFrequency` (Hz), `numberOfVoltageMeasurements`. Voltage is µV (`unit: "uV"`) only if `includeVoltage: true`.

Rings: `date` (`YYYY-MM-DD`), `activeEnergyBurned`, `appleExerciseTime`, `appleStandHours`, matching `*Goal` fields, optional `appleMoveTime` / `appleMoveTimeGoal`. Units: kcal, minutes, stand-hour counts.

Clinical: `displayName`, optional `fhirResourceType`, `fhirJson` (UTF-8 FHIR resource). Types: `allergyRecord`, `conditionRecord`, `immunizationRecord`, `labResultRecord`, `medicationRecord`, `procedureRecord`, `vitalSignRecord`, `coverageRecord`.

Audiogram: `sensitivityPoints[]` with `frequency` (Hz) and optional `leftEarSensitivity` / `rightEarSensitivity` (dBHL).

Route: `{ uuid, type, startDate, endDate, locations[] }`. Location: `latitude`, `longitude`, `timestamp`, optional `altitude`, `speed` (m/s), `course` (degrees).

Correlation: `{ uuid, type, startDate, endDate, objects: QuantitySample[] }`. `type` is `CorrelationType.bloodPressure` or `CorrelationType.food`. Blood pressure objects are systolic/diastolic quantities (mmHg). Food objects are dietary quantity samples.

Heartbeat series: `count` plus optional `beats[]` (`timeSinceSeriesStart`, `precededByGap`). `includeBeats` default `true`. Also request `QuantityType.heartRateVariabilitySDNN` if you need the HRV samples themselves.

## Write / delete

```ts
saveQuantitySample({ type, unit, value, startDate, endDate?, metadata? }): Promise<string>
saveCategorySample({ type, value, startDate, endDate?, metadata? }): Promise<string>
saveWorkout({ activityType, startDate, endDate, energyBurned?, energyBurnedUnit?, distance?, distanceUnit?, metadata? }): Promise<string>
saveCorrelation({ type, startDate, endDate?, objects, metadata? }): Promise<string>
deleteObjects({ uuid?, type?, from?, to? }): Promise<number>
```

`endDate` defaults to `startDate` for quantity/category saves.

## Characteristics

```ts
getBiologicalSex(): Promise<number>
getBloodType(): Promise<number>
getDateOfBirth(): Promise<Date | null>
getFitzpatrickSkinType(): Promise<number>
getWheelchairUse(): Promise<number>
```

Include the matching `CharacteristicType` in `toRead`. Enums: `BiologicalSex`, `BloodType`, `FitzpatrickSkinType`, `WheelchairUse`.

## Observers

```ts
observe(types: readonly string[]): Promise<void>            // persisted; re-registered at cold launch (iOS)
clearObservers(): Promise<void>
getObservedTypes(): Promise<string[]>
addUpdateListener(listener: (event: { type: string }) => void | Promise<void>): { remove(): void }
useHealthKitUpdates(): { type: string } | null
enableBackgroundDelivery(type, frequency): Promise<boolean>
disableBackgroundDelivery(type): Promise<boolean>
disableAllBackgroundDelivery(): Promise<boolean>
```

`UpdateFrequency`: `immediate` 1, `hourly` 2, `daily` 3, `weekly` 4.

Return a promise from the listener to hold the HealthKit completion handler (and a background task) until async work finishes; native times out at ~25s. Deliveries that arrive before JS subscribes are queued and flushed on the first `addUpdateListener`.

## Identifier groups

Pass Apple raw strings. Constants are autocomplete only.

| Export | Examples |
| --- | --- |
| `QuantityType` | `stepCount`, `heartRate`, `activeEnergyBurned`, `bodyMass`, `height`, `bloodGlucose`, dietary `*` |
| `CategoryType` | `sleepAnalysis`, `mindfulSession`, `appleStandHour`, menstrual / pregnancy types |
| `CharacteristicType` | `biologicalSex`, `bloodType`, `dateOfBirth`, `fitzpatrickSkinType`, `wheelchairUse`, `activityMoveMode` |
| `CorrelationType` | `bloodPressure`, `food` |
| `WorkoutType` | `workout` |
| `ElectrocardiogramType` | `electrocardiogram` |
| `AudiogramType` | `audiogram` |
| `SeriesType` | `workoutRoute`, `heartbeat` |
| `ActivitySummaryType` | `activitySummary` |
| `ClinicalType` | eight FHIR record identifiers |
| `Unit` | `count`, `countPerMinute`, `percent`, `kilogram`, `meter`, `kilocalorie`, `millimeterOfMercury`, `hertz`, `decibelHearingLevel`, `microvolt`, … |
| `WorkoutActivityType` | Apple `HKWorkoutActivityType` ints (`running` 37, `walking` 52, …) |
| `SleepAnalysisValue` | `inBed` 0, `asleepUnspecified` 1, `awake` 2, `asleepCore` 3, `asleepDeep` 4, `asleepREM` 5 |

Full quantity/category lists: `src/identifiers.ts`.

## Errors

`HealthKitUnavailableError` (`ERR_HEALTHKIT_UNAVAILABLE`) on web or when HealthKit / Health Connect is missing. Native identifier/unit/date mistakes surface as coded Expo exceptions. Apple-only APIs on Android throw `ERR_HEALTH_CONNECT_UNSUPPORTED`; Android-only ones (`requestPermissions`, `revokeAllPermissions`) on iOS throw `ERR_HEALTHKIT_UNSUPPORTED`.
