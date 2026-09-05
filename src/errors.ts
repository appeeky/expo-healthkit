export class HealthKitUnavailableError extends Error {
  readonly code = 'ERR_HEALTHKIT_UNAVAILABLE';

  constructor(
    message = 'Health data is not available. On iOS use a development build on a physical iPhone or the iOS Simulator. On Android install Health Connect and use a development build.'
  ) {
    super(message);
    this.name = 'HealthKitUnavailableError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class HealthKitError extends Error {
  readonly code: string;

  constructor(message: string, code = 'ERR_HEALTHKIT') {
    super(message);
    this.name = 'HealthKitError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
