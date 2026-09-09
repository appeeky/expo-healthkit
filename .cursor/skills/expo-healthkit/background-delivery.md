# Background delivery (iOS)

How `expo-healthkit` wakes your app when Health data changes, including when iOS has killed the process. Android Health Connect has no equivalent; these APIs throw `ERR_HEALTH_CONNECT_UNSUPPORTED` there.

## What you get

| Scenario | Behaviour |
| --- | --- |
| App in foreground | `onUpdate` fires; listener runs immediately |
| App suspended in background | iOS resumes the process, `onUpdate` fires, app stays alive until your listener settles (≤ ~25 s) |
| App killed (swipe-up, jetsam, crash) | iOS relaunches the process in the background, observers are re-registered **before JS boots**, the delivery is queued until `addUpdateListener` runs, then dispatched |

Verified on device: killed app relaunched ~10 s after a Heart Rate sample was added in Health, JS re-queried the value, completion handler called after the async work finished.

## Setup

1. Config plugin:

   ```json
   ["@appeeky/expo-healthkit", { "isBackgroundDeliveryEnabled": true }]
   ```

   Adds `com.apple.developer.healthkit.background-delivery` and `UIBackgroundModes: ["healthkit"]`. Rebuild after changing it (`npx expo prebuild` / `npx expo run:ios`).

2. HealthKit capability enabled on the App ID (Apple Developer portal) with **Background Delivery** checked.

3. Register the listener at **module scope** (or the root layout), not inside a screen. On a cold background launch there is no navigation; only code that runs on import executes.

```ts
// src/health-sync.ts — imported from app/_layout.tsx
import * as HealthKit from '@appeeky/expo-healthkit';

HealthKit.addUpdateListener(async ({ type }) => {
  const stats = await HealthKit.queryStatistics({
    type,
    unit: HealthKit.Unit.count,
    from: startOfToday(),
    options: HealthKit.StatisticsOption.cumulativeSum,
  });
  await uploadToBackend(stats); // keep it under ~20 s
});

export async function enableHealthSync() {
  await HealthKit.observe([HealthKit.QuantityType.stepCount, HealthKit.QuantityType.heartRate]);
  await HealthKit.enableBackgroundDelivery(HealthKit.QuantityType.stepCount, HealthKit.UpdateFrequency.hourly);
  await HealthKit.enableBackgroundDelivery(HealthKit.QuantityType.heartRate, HealthKit.UpdateFrequency.immediate);
}
```

Call `enableHealthSync()` once after `requestAuthorization` succeeds. Both `observe` and `enableBackgroundDelivery` are idempotent.

## API

```ts
observe(types: readonly string[]): Promise<void>
```
Replaces the observed set, persists it natively, starts `HKObserverQuery`s. Calling it with the same set that is already running is a no-op (no duplicate initial fire).

```ts
clearObservers(): Promise<void>
```
Stops all observers and forgets the persisted set. Background delivery subscriptions are separate; call `disableAllBackgroundDelivery()` too if you want iOS to stop waking the app.

```ts
getObservedTypes(): Promise<string[]>
```
Persisted set, also valid on cold start before JS called `observe`.

```ts
addUpdateListener(listener: (event: { type: string }) => void | Promise<void>): { remove(): void }
```
Return a promise to hold the HealthKit completion handler and a `UIBackgroundTask` until it settles. All listeners run for every event; completion is sent after `Promise.allSettled`. A throwing listener does not block completion.

```ts
useHealthKitUpdates(): { type: string } | null
```
React hook, latest event.

```ts
enableBackgroundDelivery(type, frequency): Promise<boolean>
disableBackgroundDelivery(type): Promise<boolean>
disableAllBackgroundDelivery(): Promise<boolean>
```
`UpdateFrequency`: `immediate` 1, `hourly` 2, `daily` 3, `weekly` 4.

## Apple limits you cannot work around

- **Hourly cap for activity types.** `stepCount`, `distanceWalkingRunning`, `distanceCycling`, `activeEnergyBurned`, `basalEnergyBurned`, `appleExerciseTime`, `appleStandTime`, `flightsClimbed`, `pushCount`, `distanceWheelchair`, `swimmingStrokeCount`, `distanceSwimming`, `distanceDownhillSnowSports`, `appleMoveTime` are delivered **at most once per hour** even with `immediate`. Heart rate, sleep, workouts, body measurements are not capped.
- ~30 s of background execution per delivery. The library gives up at 25 s and calls the completion handler anyway (`reason=timeout` in logs). Long uploads should enqueue work and finish later, not block.
- Three missed completion handlers and HealthKit stops delivering to your app until the next launch. The library always completes (JS done, timeout, or background task expiry), so this only happens if the process crashes.
- Deliveries are coalesced. The observer tells you *that* a type changed, not *what*. Re-query (`queryAnchored` for incremental sync).
- Low Power Mode and "Background App Refresh" off reduce or stop wake-ups.
- The Simulator does not relaunch killed apps for HealthKit. Test on a device.

## How it works (native)

- `HealthKitObserverCenter` (singleton, process-lifetime) owns the `HKObserverQuery`s and the observed-type list in `UserDefaults`.
- `HealthKitAppDelegateSubscriber` (registered through `expo-module.config.json`) calls `restore()` from `application(_:didFinishLaunchingWithOptions:)`, which is before the React runtime exists. The module's `OnCreate` calls it again as a fallback; it is idempotent.
- Each delivery gets a UUID token, a `UIBackgroundTask`, and a 25 s timer. The event `{ type, token }` is emitted to JS, or queued if JS has not subscribed yet. `completeUpdate(token)` (called by the JS dispatcher) invokes Apple's completion handler and ends the background task.
- `OnStopObserving` / `OnDestroy` only detach the JS sink; observers survive Fast Refresh and JS reloads.

## Debugging on device

Logs go to `os_log` subsystem `expo-healthkit`, category `observer`:

```
restore: re-registered 2 observer(s), emitter=false
delivery <token> for HKQuantityTypeIdentifierHeartRate appState=2 emitter=false
emitter attached, flushing 2 queued event(s)
complete <token> reason=js
```

`appState` 0 active, 1 inactive, 2 background. `reason` is `js`, `timeout`, or `background-task-expired`.

Stream with Console.app (filter `subsystem:expo-healthkit`) or `idevicesyslog` (`brew install libimobiledevice`). Killing the app with `xcrun devicectl device process signal --signal SIGKILL` behaves like a jetsam kill, which HealthKit will relaunch.

Manual test recipe:

1. Build a Release (or Debug with embedded bundle) build; Metro is not reachable on a cold background launch.
2. Open the app once, authorize, make sure `observe` + `enableBackgroundDelivery` ran.
3. Kill the app.
4. In Health, add a **Heart Rate** sample (not steps — hourly cap).
5. Within ~10 s the process appears; check the log sequence above.

## Checklist

- [ ] `isBackgroundDeliveryEnabled: true` and rebuilt
- [ ] Listener registered at module scope, imported from the root layout
- [ ] Listener returns a promise, finishes in < 20 s
- [ ] `observe` + `enableBackgroundDelivery` called after authorization
- [ ] Not relying on `immediate` for step count
- [ ] Tested killed → relaunch on a physical device
