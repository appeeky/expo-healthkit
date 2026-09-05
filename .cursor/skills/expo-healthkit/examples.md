# expo-healthkit examples

Same JavaScript on iOS (HealthKit) and Android (Health Connect). Apple-only APIs (rings, ECG, clinical records, characteristics, background delivery) throw `ERR_HEALTH_CONNECT_UNSUPPORTED` on Android — do not wrap them in `Platform.OS` forks unless you need a different UI.

```ts
import * as HealthKit from '@appeeky/expo-healthkit';

const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
```

## Authorization

```ts
if (!HealthKit.isAvailable()) return;

await HealthKit.requestAuthorization({
  toRead: [
    HealthKit.QuantityType.stepCount,
    HealthKit.QuantityType.heartRate,
    HealthKit.QuantityType.bodyMass,
    HealthKit.CategoryType.sleepAnalysis,
    HealthKit.WorkoutType.workout,
    HealthKit.ActivitySummaryType.activitySummary,
    HealthKit.CharacteristicType.biologicalSex,
  ],
  toShare: [HealthKit.QuantityType.stepCount],
});
```

## Today’s steps (cumulative)

```ts
const steps = await HealthKit.queryStatistics({
  type: HealthKit.QuantityType.stepCount,
  unit: HealthKit.Unit.count,
  from: startOfDay(),
  to: new Date(),
  options: HealthKit.StatisticsOption.cumulativeSum,
});
// steps.sum
```

## Recent heart rate samples

```ts
const samples = await HealthKit.queryQuantitySamples({
  type: HealthKit.QuantityType.heartRate,
  unit: HealthKit.Unit.countPerMinute,
  from: startOfDay(),
  to: new Date(),
  limit: 20,
  ascending: false,
});
```

## Latest weight (all-time)

```ts
const weight = await HealthKit.queryStatistics({
  type: HealthKit.QuantityType.bodyMass,
  unit: HealthKit.Unit.kilogram,
  options: HealthKit.StatisticsOption.discreteMostRecent,
});
// weight.mostRecent
```

Do not clamp `from`/`to` to “today” for height/weight. Those samples are sparse.

## Daily step buckets

```ts
const days = await HealthKit.queryStatisticsCollection({
  type: HealthKit.QuantityType.stepCount,
  unit: HealthKit.Unit.count,
  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  to: new Date(),
  interval: { day: 1 },
  options: HealthKit.StatisticsOption.cumulativeSum,
});
```

## Sleep last night

```ts
const sleep = await HealthKit.queryCategorySamples({
  type: HealthKit.CategoryType.sleepAnalysis,
  from: startOfDay(),
  ascending: true,
});
// sample.value === HealthKit.SleepAnalysisValue.asleepCore, etc.
```

## Activity rings (iOS)

```ts
const rings = await HealthKit.queryActivitySummaries({
  from: startOfDay(),
  to: new Date(),
});
const today = rings.at(-1);
// today.activeEnergyBurned / today.activeEnergyBurnedGoal
```

## Workouts plus GPS (route query is iOS)

```ts
const workouts = await HealthKit.queryWorkouts({
  from: startOfDay(),
  activityType: HealthKit.WorkoutActivityType.running,
  limit: 10,
});

const routes = workouts[0]
  ? await HealthKit.queryWorkoutRoute({ workoutUUID: workouts[0].uuid })
  : [];
```

`toRead` must include both `WorkoutType.workout` and `SeriesType.workoutRoute`.

## ECG (iOS, metadata only)

```ts
const ecgs = await HealthKit.queryElectrocardiograms({
  limit: 5,
  includeVoltage: false,
});
// ecgs[0].classification === HealthKit.ElectrocardiogramClassification.sinusRhythm
```

## Clinical (iOS, plugin flag required)

```ts
const allergies = await HealthKit.queryClinicalRecords({
  type: HealthKit.ClinicalType.allergyRecord,
  limit: 20,
});
// JSON.parse(allergies[0].fhirJson ?? '{}')
```

Needs `isClinicalDataEnabled: true` on the config plugin.

## Write and delete

```ts
const uuid = await HealthKit.saveQuantitySample({
  type: HealthKit.QuantityType.stepCount,
  unit: HealthKit.Unit.count,
  value: 100,
  startDate: new Date(Date.now() - 60_000),
  endDate: new Date(),
});

await HealthKit.deleteObjects({
  type: HealthKit.QuantityType.stepCount,
  uuid,
});
```

## Blood pressure

```ts
await HealthKit.requestAuthorization({
  toRead: [
    HealthKit.CorrelationType.bloodPressure,
    HealthKit.QuantityType.bloodPressureSystolic,
    HealthKit.QuantityType.bloodPressureDiastolic,
  ],
  toShare: [
    HealthKit.CorrelationType.bloodPressure,
    HealthKit.QuantityType.bloodPressureSystolic,
    HealthKit.QuantityType.bloodPressureDiastolic,
  ],
});

const readings = await HealthKit.queryCorrelations({
  type: HealthKit.CorrelationType.bloodPressure,
  limit: 20,
});

await HealthKit.saveCorrelation({
  type: HealthKit.CorrelationType.bloodPressure,
  startDate: new Date(),
  objects: [
    {
      type: HealthKit.QuantityType.bloodPressureSystolic,
      unit: HealthKit.Unit.millimeterOfMercury,
      value: 120,
    },
    {
      type: HealthKit.QuantityType.bloodPressureDiastolic,
      unit: HealthKit.Unit.millimeterOfMercury,
      value: 80,
    },
  ],
});
```

## Food

```ts
await HealthKit.saveCorrelation({
  type: HealthKit.CorrelationType.food,
  startDate: new Date(),
  objects: [
    {
      type: HealthKit.QuantityType.dietaryEnergyConsumed,
      unit: HealthKit.Unit.kilocalorie,
      value: 450,
    },
    { type: HealthKit.QuantityType.dietaryProtein, unit: HealthKit.Unit.gram, value: 22 },
  ],
  metadata: { HKFoodType: 'Burrito' },
});
```

## Heartbeat series (iOS)

```ts
const series = await HealthKit.queryHeartbeatSeries({
  from: startOfDay(),
  limit: 5,
});
```

## Anchored sync

```ts
let anchor: string | null = null;

const page = await HealthKit.queryAnchored({
  type: HealthKit.QuantityType.heartRate,
  unit: HealthKit.Unit.countPerMinute,
  anchor,
});
anchor = page.anchor;
// persist anchor; apply page.added / page.deleted
```

## Background delivery (iOS)

```ts
await HealthKit.observe([HealthKit.QuantityType.stepCount]);

const subscription = HealthKit.addUpdateListener(({ type }) => {
  void HealthKit.queryStatistics({
    type,
    unit: HealthKit.Unit.count,
    from: startOfDay(),
    options: HealthKit.StatisticsOption.cumulativeSum,
  });
});

await HealthKit.enableBackgroundDelivery(
  HealthKit.QuantityType.stepCount,
  HealthKit.UpdateFrequency.hourly
);

// subscription.remove(); HealthKit.clearObservers();
```
