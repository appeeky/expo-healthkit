import { HealthKitError, HealthKitUnavailableError } from '../errors';

describe('errors', () => {
  it('is catchable as HealthKitUnavailableError', () => {
    const error = new HealthKitUnavailableError();
    expect(error).toBeInstanceOf(HealthKitUnavailableError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('ERR_HEALTHKIT_UNAVAILABLE');
  });

  it('keeps a custom HealthKitError code', () => {
    const error = new HealthKitError('denied', 'ERR_HEALTHKIT_DENIED');
    expect(error).toBeInstanceOf(HealthKitError);
    expect(error.code).toBe('ERR_HEALTHKIT_DENIED');
  });

  it('defaults HealthKitError to ERR_HEALTHKIT', () => {
    expect(new HealthKitError('oops').code).toBe('ERR_HEALTHKIT');
  });
});
