---
name: expo-healthkit
description: >-
  Use expo-healthkit, the identifier-based HealthKit (iOS) and Health Connect (Android) SDK for Expo/React Native.
  Triggers: expo-healthkit, @appeeky/expo-healthkit, HealthKit, Health Connect, Apple Health, Google Health Connect, HKQuantityType, queryQuantitySamples,
  queryStatistics, activity rings, ECG, audiogram, clinical records, workout GPS route,
  correlations, blood pressure, heartbeat series, requestAuthorization, NSHealthShareUsageDescription, development builds for HealthKit.
---

# expo-healthkit

Generic HealthKit-style SDK for **iOS and Android**. One query/save API plus Apple identifier strings — not `getStepCount()` / `getHeartRateSamples()`. iOS uses HealthKit; Android maps the same identifiers onto Health Connect. App code should not `Platform.OS` fork mapped types.

Source of truth in this repo: `src/index.ts`, `src/identifiers.ts`, `src/types.ts`, `plugin/src/index.ts`.

## Constraints

- iOS (HealthKit) and Android (Health Connect). `isAvailable()` is `false` on web; query methods throw `HealthKitUnavailableError` when the platform backend is missing.
- **Not Expo Go.** Development build: `npx expo run:ios` or `npx expo run:android`.
- New Architecture / Expo SDK 53+ (tested on 57). Native Swift, Kotlin, or plugin changes need a rebuild, not Metro reload.
- Enable the **HealthKit** capability on the App ID in the Apple Developer portal. On Android, Health Connect must be installed (built-in on Android 14+). The config plugin sets `android.minSdkVersion` to 26.

## Setup

```sh
npx expo install @appeeky/expo-healthkit
# from GitHub: npx expo install github:appeeky/expo-healthkit
```

```json
{
  "expo": {
    "plugins": [
      [
        "@appeeky/expo-healthkit",
        {
          "healthSharePermission": "Allow $(PRODUCT_NAME) to read your health data",
          "healthUpdatePermission": "Allow $(PRODUCT_NAME) to write health data"
        }
      ]
    ]
  }
}
```

Optional plugin flags: `isBackgroundDeliveryEnabled`, `isClinicalDataEnabled`, `healthConnectPrivacyPolicyUrl`. Then `npx expo prebuild` / `npx expo run:ios` / `npx expo run:android`.

```ts
import * as HealthKit from '@appeeky/expo-healthkit';
```

Named exports and `default` are the same surface.

## Pick the query

| Need | API | `toRead` identifier |
| --- | --- | --- |
| Steps, HR, weight, energy, distance, nutrition | `queryQuantitySamples` / `queryStatistics` / `queryStatisticsCollection` | `QuantityType.*` plus matching `Unit` |
| Sleep, mindful, stand hour, cycle tracking | `queryCategorySamples` | `CategoryType.*` |
| Workouts | `queryWorkouts` | `WorkoutType.workout` |
| Move / Exercise / Stand rings | `queryActivitySummaries` | `ActivitySummaryType.activitySummary` |
| ECG | `queryElectrocardiograms` | `ElectrocardiogramType.electrocardiogram` |
| Hearing test | `queryAudiograms` | `AudiogramType.audiogram` |
| FHIR clinical records | `queryClinicalRecords` | `ClinicalType.*` plus plugin `isClinicalDataEnabled` |
| Workout GPS | `queryWorkoutRoute({ workoutUUID })` | `WorkoutType.workout` and `SeriesType.workoutRoute` |
| Blood pressure / food | `queryCorrelations` / `saveCorrelation` | `CorrelationType.bloodPressure` or `CorrelationType.food` plus the quantity types in `objects` |
| Heartbeat series (HRV beats) | `queryHeartbeatSeries` | `SeriesType.heartbeat` |
| Incremental sync | `queryAnchored` | quantity type |
| Sex, blood type, DOB, skin, wheelchair | `getBiologicalSex` etc. | `CharacteristicType.*` |

Do **not** send ECG, rings, clinical, audiogram, routes, heartbeat series, or correlations through `queryQuantitySamples` / `queryCategorySamples` / `queryWorkouts`. They are different HealthKit classes. Unknown identifiers are still forwarded if HealthKit knows them.

On Android, keep the same identifiers. Mapped types (steps, HR, sleep, workouts, weight, BP, nutrition, …) go to Health Connect. Unmapped identifiers are skipped in `requestAuthorization`. Apple-only APIs (ECG, rings, clinical, audiogram, heartbeat series, characteristics, background delivery) throw `ERR_HEALTH_CONNECT_UNSUPPORTED`. Blood pressure / food correlations are mapped.

## Authorization

```ts
if (!HealthKit.isAvailable()) return;

await HealthKit.requestAuthorization({
  toRead: [HealthKit.QuantityType.stepCount, HealthKit.WorkoutType.workout],
  toShare: [HealthKit.QuantityType.stepCount],
});
```

- Request every type you will query or save. Missing `toRead` yields empty results, not a typed permission error.
- `getAuthorizationStatus` is reliable for **write** on iOS. Apple does not disclose read grants. Empty data can mean no samples **or** denied read. Android Health Connect can report granted read or write access.
- `getRequestStatusForAuthorization` tells you whether to show the system sheet again.
- Activity summaries are not writable. Do not put `ActivitySummaryType` in `toShare`.
- App code should not `Platform.OS` fork per call. Use the same identifiers; catch unsupported APIs on Android.

## Query defaults

- Dates: `Date` or ISO-8601. `limit` `0` / omitted = HealthKit unlimited. `ascending` default `false` (newest first).
- Statistics: pass a `StatisticsOption` bitmask (`cumulativeSum` for steps; `discreteAverage` or `discreteMostRecent` for heart rate / weight). Combine with bitwise OR.
- Cumulative totals use `queryStatistics`. Discrete series use `queryQuantitySamples`. Daily buckets use `queryStatisticsCollection` (`interval` default `{ day: 1 }`).
- Height / weight: query **all-time** with `discreteMostRecent`. A tight `to: now` window often returns nothing.
- ECG: `includeVoltage` default `false`. `true` can return thousands of µV points.
- Rings: `from`/`to` are calendar days, not sample timestamps. `date` is `YYYY-MM-DD`.
- Routes: look up a workout UUID first, then `queryWorkoutRoute`. Returns zero or more routes.

## Write

`saveQuantitySample`, `saveCategorySample`, `saveWorkout`, `saveCorrelation` return the new UUID. `deleteObjects({ type, uuid })` (or type plus date range). The user can only delete objects this app saved.

Sleep values: `SleepAnalysisValue` (`asleepCore`, `asleepDeep`, `asleepREM`, …).

## Background

Needs plugin `isBackgroundDeliveryEnabled: true`.

```ts
await HealthKit.observe([HealthKit.QuantityType.stepCount]);
const sub = HealthKit.addUpdateListener(({ type }) => {
  // re-query
});
await HealthKit.enableBackgroundDelivery(
  HealthKit.QuantityType.stepCount,
  HealthKit.UpdateFrequency.hourly
);
```

`useHealthKitUpdates()` is the React hook for the same event. The observer callback is not the data — re-query.

## Do not

- Invent per-type JS methods (`getStepCount`, `getSleepSamples`).
- Use `queryQuantitySamples` for workouts, ECG, rings, clinical, audiograms, GPS, heartbeat series, or correlations.
- Treat `AuthorizationStatus.sharingDenied` as “user blocked reads” on iOS.
- Ship health features in Expo Go.
- Request clinical types without `isClinicalDataEnabled`.
- Upload health data without the app’s privacy policy and store review rules. Data stays on-device unless the app sends it.

## More

- Method signatures, plugin props, units, enums: [reference.md](reference.md)
- Copy-paste flows: [examples.md](examples.md)
- iOS vs Android mapping tables: repository `README.md` (Cross-platform section)
