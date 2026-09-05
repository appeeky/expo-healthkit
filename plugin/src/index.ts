import {
  AndroidConfig,
  ConfigPlugin,
  IOSConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withEntitlementsPlist,
  withGradleProperties,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('../../package.json');

const DEFAULT_SHARE = 'Allow $(PRODUCT_NAME) to read your health data';
const DEFAULT_UPDATE = 'Allow $(PRODUCT_NAME) to write health data';
const DEFAULT_CLINICAL = 'Allow $(PRODUCT_NAME) to read your clinical health records';

const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';
const PRIVACY_POLICY_META = 'expo.modules.healthkit.HEALTH_CONNECT_PRIVACY_POLICY_URL';
const HEALTH_CONNECT_MIN_SDK = 26;

const HEALTH_CONNECT_PERMISSIONS = [
  'android.permission.health.READ_STEPS',
  'android.permission.health.WRITE_STEPS',
  'android.permission.health.READ_DISTANCE',
  'android.permission.health.WRITE_DISTANCE',
  'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
  'android.permission.health.WRITE_ACTIVE_CALORIES_BURNED',
  'android.permission.health.READ_TOTAL_CALORIES_BURNED',
  'android.permission.health.WRITE_TOTAL_CALORIES_BURNED',
  'android.permission.health.READ_FLOORS_CLIMBED',
  'android.permission.health.WRITE_FLOORS_CLIMBED',
  'android.permission.health.READ_HEART_RATE',
  'android.permission.health.WRITE_HEART_RATE',
  'android.permission.health.READ_RESTING_HEART_RATE',
  'android.permission.health.WRITE_RESTING_HEART_RATE',
  'android.permission.health.READ_HEART_RATE_VARIABILITY',
  'android.permission.health.WRITE_HEART_RATE_VARIABILITY',
  'android.permission.health.READ_OXYGEN_SATURATION',
  'android.permission.health.WRITE_OXYGEN_SATURATION',
  'android.permission.health.READ_RESPIRATORY_RATE',
  'android.permission.health.WRITE_RESPIRATORY_RATE',
  'android.permission.health.READ_BODY_TEMPERATURE',
  'android.permission.health.WRITE_BODY_TEMPERATURE',
  'android.permission.health.READ_BLOOD_GLUCOSE',
  'android.permission.health.WRITE_BLOOD_GLUCOSE',
  'android.permission.health.READ_BLOOD_PRESSURE',
  'android.permission.health.WRITE_BLOOD_PRESSURE',
  'android.permission.health.READ_VO2_MAX',
  'android.permission.health.WRITE_VO2_MAX',
  'android.permission.health.READ_HEIGHT',
  'android.permission.health.WRITE_HEIGHT',
  'android.permission.health.READ_WEIGHT',
  'android.permission.health.WRITE_WEIGHT',
  'android.permission.health.READ_BODY_FAT',
  'android.permission.health.WRITE_BODY_FAT',
  'android.permission.health.READ_LEAN_BODY_MASS',
  'android.permission.health.WRITE_LEAN_BODY_MASS',
  'android.permission.health.READ_SLEEP',
  'android.permission.health.WRITE_SLEEP',
  'android.permission.health.READ_EXERCISE',
  'android.permission.health.WRITE_EXERCISE',
  'android.permission.health.READ_NUTRITION',
  'android.permission.health.WRITE_NUTRITION',
  'android.permission.health.READ_HYDRATION',
  'android.permission.health.WRITE_HYDRATION',
  'android.permission.health.READ_WHEELCHAIR_PUSHES',
  'android.permission.health.WRITE_WHEELCHAIR_PUSHES',
  'android.permission.health.READ_HEALTH_DATA_HISTORY',
];

export interface ExpoHealthKitPluginProps {
  /**
   * `NSHealthShareUsageDescription`. Pass `false` to skip writing the key.
   */
  healthSharePermission?: string | false;
  /**
   * `NSHealthUpdateUsageDescription`. Pass `false` to skip writing the key.
   */
  healthUpdatePermission?: string | false;
  /**
   * `NSHealthClinicalHealthRecordsShareUsageDescription`. Used when
   * `isClinicalDataEnabled` is true.
   */
  healthClinicalRecordsPermission?: string | false;
  /**
   * Adds the HealthKit background-delivery entitlement and `healthkit` UIBackgroundModes.
   */
  isBackgroundDeliveryEnabled?: boolean;
  /**
   * Adds the `health-records` HealthKit access entitlement and clinical usage string.
   */
  isClinicalDataEnabled?: boolean;
  /**
   * Privacy policy URL shown from the Health Connect permission rationale screen.
   */
  healthConnectPrivacyPolicyUrl?: string;
}

const withHealthKitEntitlements: ConfigPlugin<ExpoHealthKitPluginProps> = (config, props = {}) => {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.healthkit'] = true;

    if (props.isBackgroundDeliveryEnabled) {
      config.modResults['com.apple.developer.healthkit.background-delivery'] = true;
    }

    if (props.isClinicalDataEnabled) {
      config.modResults['com.apple.developer.healthkit.access'] = ['health-records'];
    }

    return config;
  });
};

const withHealthKitBackgroundModes: ConfigPlugin<ExpoHealthKitPluginProps> = (
  config,
  props = {}
) => {
  if (!props.isBackgroundDeliveryEnabled) {
    return config;
  }

  return withInfoPlist(config, (config) => {
    const modes = new Set<string>(
      Array.isArray(config.modResults.UIBackgroundModes) ? config.modResults.UIBackgroundModes : []
    );
    modes.add('healthkit');
    config.modResults.UIBackgroundModes = [...modes];
    return config;
  });
};

const withHealthKitUsageDescriptions: ConfigPlugin<ExpoHealthKitPluginProps> = (
  config,
  props = {}
) => {
  const defaults: Record<string, string> = {
    NSHealthShareUsageDescription: DEFAULT_SHARE,
    NSHealthUpdateUsageDescription: DEFAULT_UPDATE,
  };
  const values: Record<string, string | false | undefined> = {
    NSHealthShareUsageDescription: props.healthSharePermission,
    NSHealthUpdateUsageDescription: props.healthUpdatePermission,
  };

  if (props.isClinicalDataEnabled) {
    defaults.NSHealthClinicalHealthRecordsShareUsageDescription = DEFAULT_CLINICAL;
    values.NSHealthClinicalHealthRecordsShareUsageDescription =
      props.healthClinicalRecordsPermission;
  }

  return IOSConfig.Permissions.createPermissionsPlugin(defaults)(config, values);
};

const withHealthConnectMinSdk: ConfigPlugin = (config) => {
  return withGradleProperties(config, (config) => {
    const existing = config.modResults.find(
      (item) => item.type === 'property' && item.key === 'android.minSdkVersion'
    );
    const current =
      existing && existing.type === 'property' ? Number.parseInt(existing.value, 10) : Number.NaN;
    if (!Number.isFinite(current) || current < HEALTH_CONNECT_MIN_SDK) {
      AndroidConfig.BuildProperties.updateAndroidBuildProperty(
        config.modResults,
        'android.minSdkVersion',
        String(HEALTH_CONNECT_MIN_SDK)
      );
    }
    return config;
  });
};

const withHealthConnectManifest: ConfigPlugin<ExpoHealthKitPluginProps> = (config, props = {}) => {
  config = AndroidConfig.Permissions.withPermissions(config, HEALTH_CONNECT_PERMISSIONS);

  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest as typeof config.modResults.manifest & {
      queries?: { package?: { $: { 'android:name': string } }[] }[];
    };

    const queries = manifest.queries ?? [];
    const hasHealthConnect = queries.some((query) =>
      query.package?.some((item) => item.$['android:name'] === HEALTH_CONNECT_PACKAGE)
    );
    if (!hasHealthConnect) {
      queries.push({
        package: [{ $: { 'android:name': HEALTH_CONNECT_PACKAGE } }],
      });
      manifest.queries = queries;
    }

    if (props.healthConnectPrivacyPolicyUrl) {
      const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(
        application,
        PRIVACY_POLICY_META,
        props.healthConnectPrivacyPolicyUrl
      );
    }

    return config;
  });
};

const withExpoHealthKit: ConfigPlugin<ExpoHealthKitPluginProps | void> = (config, props) => {
  const pluginProps = props ?? {};
  config = withHealthKitEntitlements(config, pluginProps);
  config = withHealthKitBackgroundModes(config, pluginProps);
  config = withHealthKitUsageDescriptions(config, pluginProps);
  config = withHealthConnectMinSdk(config);
  config = withHealthConnectManifest(config, pluginProps);
  return config;
};

export default createRunOncePlugin(withExpoHealthKit, pkg.name, pkg.version);
