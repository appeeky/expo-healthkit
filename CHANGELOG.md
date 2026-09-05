# Changelog

## 0.1.0

### New features

- Initial Expo Modules API wrapper for Apple HealthKit
- Android Health Connect backend behind the same identifier-based JS API
- Generic quantity, category, workout, statistics, and anchored queries
- ECG, activity rings, clinical records, audiograms, and workout GPS route queries
- Blood pressure / food correlations (`queryCorrelations`, `saveCorrelation`) and heartbeat series
- Authorization, characteristics, observers, and background delivery
- Config plugin for HealthKit entitlements, usage descriptions, Health Connect permissions, and Android `minSdk` 26

### Fixes

- Request Health Connect permissions via the Android 14+ runtime permission APIs instead of `startActivityForResult`, which throws `ActivityNotFoundException`
- Convert HealthKit `NSException` crashes (invalid predicates, missing calendars) into `ERR_HEALTHKIT_NATIVE` promise rejections so the JS app can show the error instead of aborting

### Packaging

- Published as [`@appeeky/expo-healthkit`](https://www.npmjs.com/package/@appeeky/expo-healthkit)
- npm-ready `exports`, `.npmignore`, and `prepublishOnly` build
- App Store privacy manifest (`PrivacyInfo.xcprivacy`)
- GitHub Actions for lint, typecheck, tests with coverage thresholds, pack contents, and automated semver releases to npm
- [PolyForm Shield 1.0.0](./LICENSE) (source-available; apps may use the SDK, competing SDKs may not)
