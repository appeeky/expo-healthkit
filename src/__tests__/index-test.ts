import * as HealthKit from '../index';

type MockNative = Record<string, jest.Mock>;

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('../ExpoHealthKitModule', () => ({
  __esModule: true,
  default: {
    isHealthDataAvailable: jest.fn(() => true),
    getSupportedTypes: jest.fn((candidates: string[]) =>
      candidates.filter((candidate) =>
        ['HKQuantityTypeIdentifierStepCount', 'HKQuantityTypeIdentifierHeartRate'].includes(
          candidate
        )
      )
    ),
    requestAuthorization: jest.fn(async () => true),
    getGrantedPermissions: jest.fn(async () => ['android.permission.health.READ_STEPS']),
    revokeAllPermissions: jest.fn(async () => {}),
    requestPermissions: jest.fn(async (permissions: string[]) => permissions),
    queryQuantitySamples: jest.fn(async () => []),
    queryCategorySamples: jest.fn(async () => []),
    queryWorkouts: jest.fn(async () => []),
    queryElectrocardiograms: jest.fn(async () => []),
    queryAudiograms: jest.fn(async () => []),
    queryClinicalRecords: jest.fn(async () => []),
    queryCorrelations: jest.fn(async () => []),
    queryHeartbeatSeries: jest.fn(async () => []),
    queryStatistics: jest.fn(async () => ({
      startDate: '2024-01-15T00:00:00.000Z',
      endDate: '2024-01-16T00:00:00.000Z',
      unit: 'count',
    })),
    queryStatisticsCollection: jest.fn(async () => []),
    queryAnchored: jest.fn(async () => ({ added: [], deleted: [] })),
  },
}));

const mockNative = jest.requireMock<{ default: MockNative }>('../ExpoHealthKitModule').default;

const SOURCES = ['com.apple.health', 'com.garmin.connect.mobile'];
const EXCLUDE = ['self'];

function lastCall(fn: jest.Mock): Record<string, unknown> {
  return fn.mock.calls[fn.mock.calls.length - 1][0];
}

describe('source filters', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    [
      'queryQuantitySamples',
      () =>
        HealthKit.queryQuantitySamples({
          type: HealthKit.QuantityType.heartRate,
          unit: HealthKit.Unit.countPerMinute,
          sources: SOURCES,
          excludeSources: EXCLUDE,
        }),
    ],
    [
      'queryCategorySamples',
      () =>
        HealthKit.queryCategorySamples({
          type: HealthKit.CategoryType.sleepAnalysis,
          sources: SOURCES,
          excludeSources: EXCLUDE,
        }),
    ],
    ['queryWorkouts', () => HealthKit.queryWorkouts({ sources: SOURCES, excludeSources: EXCLUDE })],
    [
      'queryElectrocardiograms',
      () => HealthKit.queryElectrocardiograms({ sources: SOURCES, excludeSources: EXCLUDE }),
    ],
    [
      'queryAudiograms',
      () => HealthKit.queryAudiograms({ sources: SOURCES, excludeSources: EXCLUDE }),
    ],
    [
      'queryClinicalRecords',
      () =>
        HealthKit.queryClinicalRecords({
          type: HealthKit.ClinicalType.allergyRecord,
          sources: SOURCES,
          excludeSources: EXCLUDE,
        }),
    ],
    [
      'queryCorrelations',
      () =>
        HealthKit.queryCorrelations({
          type: HealthKit.CorrelationType.bloodPressure,
          sources: SOURCES,
          excludeSources: EXCLUDE,
        }),
    ],
    [
      'queryHeartbeatSeries',
      () => HealthKit.queryHeartbeatSeries({ sources: SOURCES, excludeSources: EXCLUDE }),
    ],
    [
      'queryStatistics',
      () =>
        HealthKit.queryStatistics({
          type: HealthKit.QuantityType.stepCount,
          unit: HealthKit.Unit.count,
          sources: SOURCES,
          excludeSources: EXCLUDE,
        }),
    ],
    [
      'queryStatisticsCollection',
      () =>
        HealthKit.queryStatisticsCollection({
          type: HealthKit.QuantityType.stepCount,
          unit: HealthKit.Unit.count,
          sources: SOURCES,
          excludeSources: EXCLUDE,
        }),
    ],
    [
      'queryAnchored',
      () =>
        HealthKit.queryAnchored({
          type: HealthKit.QuantityType.stepCount,
          unit: HealthKit.Unit.count,
          sources: SOURCES,
          excludeSources: EXCLUDE,
        }),
    ],
  ])('%s passes sources and excludeSources to native unchanged', async (name, run) => {
    await run();
    const options = lastCall(mockNative[name]);
    expect(options.sources).toEqual(SOURCES);
    expect(options.excludeSources).toEqual(EXCLUDE);
    // Copies, so a readonly input never reaches the bridge by reference.
    expect(options.sources).not.toBe(SOURCES);
    expect(options.excludeSources).not.toBe(EXCLUDE);
  });

  it('leaves both filters undefined when not requested', async () => {
    await HealthKit.queryQuantitySamples({
      type: HealthKit.QuantityType.stepCount,
      unit: HealthKit.Unit.count,
    });
    const options = lastCall(mockNative.queryQuantitySamples);
    expect(options.sources).toBeUndefined();
    expect(options.excludeSources).toBeUndefined();
    expect(options).toMatchObject({ type: HealthKit.QuantityType.stepCount, limit: 0 });
  });

  it("does not resolve 'self' in JS", async () => {
    await HealthKit.queryWorkouts({ excludeSources: ['self'] });
    expect(lastCall(mockNative.queryWorkouts).excludeSources).toEqual(['self']);
  });
});

describe('supported types', () => {
  beforeEach(() => jest.clearAllMocks());

  it('probes every exported identifier constant', () => {
    const supported = HealthKit.getSupportedTypes();
    const candidates = mockNative.getSupportedTypes.mock.calls[0][0];
    expect(candidates).toEqual(
      expect.arrayContaining([
        HealthKit.QuantityType.stepCount,
        HealthKit.CategoryType.sleepAnalysis,
        HealthKit.CharacteristicType.biologicalSex,
        HealthKit.CorrelationType.food,
        HealthKit.WorkoutType.workout,
        HealthKit.ElectrocardiogramType.electrocardiogram,
        HealthKit.AudiogramType.audiogram,
        HealthKit.SeriesType.heartbeat,
        HealthKit.ActivitySummaryType.activitySummary,
        HealthKit.ClinicalType.allergyRecord,
      ])
    );
    expect(new Set(candidates).size).toBe(candidates.length);
    expect(supported).toEqual([HealthKit.QuantityType.stepCount, HealthKit.QuantityType.heartRate]);
  });

  it('getUnsupportedTypes returns the identifiers native did not resolve, in order', () => {
    const asked = [
      HealthKit.QuantityType.vo2Max,
      HealthKit.QuantityType.stepCount,
      HealthKit.QuantityType.appleExerciseTime,
    ];
    expect(HealthKit.getUnsupportedTypes(asked)).toEqual([
      HealthKit.QuantityType.vo2Max,
      HealthKit.QuantityType.appleExerciseTime,
    ]);
    // Probes what was asked, so an identifier outside the exported constants can still resolve.
    expect(mockNative.getSupportedTypes).toHaveBeenCalledWith(asked);
  });

  it('getUnsupportedTypes is empty when everything resolves', () => {
    expect(HealthKit.getUnsupportedTypes([HealthKit.QuantityType.stepCount])).toEqual([]);
  });
});

describe('permissions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requestAuthorization defaults includeBackgroundRead to false', async () => {
    await HealthKit.requestAuthorization({ toRead: [HealthKit.QuantityType.stepCount] });
    expect(lastCall(mockNative.requestAuthorization)).toEqual({
      toRead: [HealthKit.QuantityType.stepCount],
      toShare: [],
      includeBackgroundRead: false,
    });
  });

  it('requestAuthorization forwards includeBackgroundRead', async () => {
    await HealthKit.requestAuthorization({
      toRead: [HealthKit.QuantityType.stepCount],
      includeBackgroundRead: true,
    });
    expect(lastCall(mockNative.requestAuthorization).includeBackgroundRead).toBe(true);
  });

  it('getGrantedPermissions probes the exported identifiers and returns the native list', async () => {
    await expect(HealthKit.getGrantedPermissions()).resolves.toEqual([
      'android.permission.health.READ_STEPS',
    ]);
    expect(mockNative.getGrantedPermissions.mock.calls[0][0]).toContain(
      HealthKit.QuantityType.stepCount
    );
  });

  it('requestPermissions passes raw permission strings through', async () => {
    const permissions = ['android.permission.health.READ_SLEEP'];
    await expect(HealthKit.requestPermissions(permissions)).resolves.toEqual(permissions);
    expect(mockNative.requestPermissions).toHaveBeenCalledWith(permissions);
  });

  it('revokeAllPermissions resolves to void', async () => {
    await expect(HealthKit.revokeAllPermissions()).resolves.toBeUndefined();
    expect(mockNative.revokeAllPermissions).toHaveBeenCalledTimes(1);
  });
});

describe('off-platform', () => {
  const platform = jest.requireMock<{ Platform: { OS: string } }>('react-native').Platform;

  afterEach(() => {
    platform.OS = 'ios';
  });

  it('getSupportedTypes is empty on web without touching native', () => {
    platform.OS = 'web';
    mockNative.getSupportedTypes.mockClear();
    expect(HealthKit.getSupportedTypes()).toEqual([]);
    expect(HealthKit.getUnsupportedTypes([HealthKit.QuantityType.stepCount])).toEqual([
      HealthKit.QuantityType.stepCount,
    ]);
    expect(mockNative.getSupportedTypes).not.toHaveBeenCalled();
  });
});
