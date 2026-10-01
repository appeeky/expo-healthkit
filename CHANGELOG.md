## [0.4.1](https://github.com/appeeky/expo-healthkit/compare/v0.4.0...v0.4.1) (2026-10-01)


### Bug Fixes

* **android:** only delete this app's records in a deleteObjects range ([#10](https://github.com/appeeky/expo-healthkit/issues/10)) ([71acaef](https://github.com/appeeky/expo-healthkit/commit/71acaef9431f190035db223a60e5ad82ffd02663))

# [0.4.0](https://github.com/appeeky/expo-healthkit/compare/v0.3.0...v0.4.0) (2026-10-01)


### Features

* **android:** page anchored sync and surface expired anchors ([#7](https://github.com/appeeky/expo-healthkit/issues/7)) ([89d5d7e](https://github.com/appeeky/expo-healthkit/commit/89d5d7e2471f1c8f3af39dc1a0d1afe58168918a)), closes [#6](https://github.com/appeeky/expo-healthkit/issues/6)

# [0.3.0](https://github.com/appeeky/expo-healthkit/compare/v0.2.1...v0.3.0) (2026-10-01)


### Features

* source filters, HRV statistic marker, getSupportedTypes, Android permission surface, configurable plugin permissions ([#3](https://github.com/appeeky/expo-healthkit/issues/3)) ([0013f31](https://github.com/appeeky/expo-healthkit/commit/0013f3138ff4dee23584e3d7fc335be558de8273))

## [0.2.1](https://github.com/appeeky/expo-healthkit/compare/v0.2.0...v0.2.1) (2026-10-01)


### Bug Fixes

* **plugin:** stop adding invalid 'healthkit' to UIBackgroundModes ([#5](https://github.com/appeeky/expo-healthkit/issues/5)) ([4f44bd6](https://github.com/appeeky/expo-healthkit/commit/4f44bd62c10526726bb0941bfa7529edcee14acf)), closes [#4](https://github.com/appeeky/expo-healthkit/issues/4)

# [0.2.0](https://github.com/appeeky/expo-healthkit/compare/v0.1.1...v0.2.0) (2026-09-09)


### Features

* **ios:** deliver HealthKit background updates before JS starts and hold the completion handler ([6ac0e6f](https://github.com/appeeky/expo-healthkit/commit/6ac0e6fde217940f3e89a7cd5ff64c68a12a0b2b))

## [0.1.1](https://github.com/appeeky/expo-healthkit/compare/v0.1.0...v0.1.1) (2026-09-05)


### Bug Fixes

* use local datetime for Health Connect daily statistics ([d01e776](https://github.com/appeeky/expo-healthkit/commit/d01e776398fb7f45b2b4c0401593a871f03bb700))

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
