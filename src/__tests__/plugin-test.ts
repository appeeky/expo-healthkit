import {
  HEALTH_CONNECT_PERMISSIONS,
  normalizeHealthConnectPermission,
  resolveHealthConnectPermissions,
} from '../../plugin/src';

const BACKGROUND_READ = 'android.permission.health.READ_HEALTH_DATA_IN_BACKGROUND';

describe('config plugin Health Connect permissions', () => {
  it('declares the full mapped list by default', () => {
    expect(resolveHealthConnectPermissions({})).toEqual(HEALTH_CONNECT_PERMISSIONS);
    expect(HEALTH_CONNECT_PERMISSIONS).toHaveLength(47);
    expect(HEALTH_CONNECT_PERMISSIONS).not.toContain(BACKGROUND_READ);
  });

  it('accepts short and fully qualified names and declares only those', () => {
    expect(
      resolveHealthConnectPermissions({
        healthConnectPermissions: [
          'READ_STEPS',
          'android.permission.health.READ_HEART_RATE',
          'READ_STEPS',
        ],
      })
    ).toEqual([
      'android.permission.health.READ_STEPS',
      'android.permission.health.READ_HEART_RATE',
    ]);
  });

  it('declares nothing for an empty list', () => {
    expect(resolveHealthConnectPermissions({ healthConnectPermissions: [] })).toEqual([]);
  });

  it('adds background read on top of either list, once', () => {
    expect(resolveHealthConnectPermissions({ isHealthConnectBackgroundReadEnabled: true })).toEqual(
      [...HEALTH_CONNECT_PERMISSIONS, BACKGROUND_READ]
    );
    expect(
      resolveHealthConnectPermissions({
        healthConnectPermissions: ['READ_STEPS', 'READ_HEALTH_DATA_IN_BACKGROUND'],
        isHealthConnectBackgroundReadEnabled: true,
      })
    ).toEqual(['android.permission.health.READ_STEPS', BACKGROUND_READ]);
  });

  it('does not add background read when the flag is false', () => {
    expect(
      resolveHealthConnectPermissions({
        healthConnectPermissions: ['READ_STEPS'],
        isHealthConnectBackgroundReadEnabled: false,
      })
    ).toEqual(['android.permission.health.READ_STEPS']);
  });

  it('normalizes idempotently', () => {
    const full = normalizeHealthConnectPermission('WRITE_SLEEP');
    expect(full).toBe('android.permission.health.WRITE_SLEEP');
    expect(normalizeHealthConnectPermission(full)).toBe(full);
  });
});
