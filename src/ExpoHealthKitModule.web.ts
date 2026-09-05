import { NativeModule, registerWebModule } from 'expo';

import { HealthKitUnavailableError } from './errors';
import type { ExpoHealthKitModuleEvents } from './types';

function unavailable(): never {
  throw new HealthKitUnavailableError();
}

class ExpoHealthKitModule extends NativeModule<ExpoHealthKitModuleEvents> {
  isHealthDataAvailable(): boolean {
    return false;
  }

  async requestAuthorization(): Promise<boolean> {
    return unavailable();
  }

  async getAuthorizationStatus(): Promise<number> {
    return unavailable();
  }

  async getRequestStatusForAuthorization(): Promise<number> {
    return unavailable();
  }

  async queryQuantitySamples(): Promise<never> {
    return unavailable();
  }

  async queryCategorySamples(): Promise<never> {
    return unavailable();
  }

  async queryWorkouts(): Promise<never> {
    return unavailable();
  }

  async queryElectrocardiograms(): Promise<never> {
    return unavailable();
  }

  async queryActivitySummaries(): Promise<never> {
    return unavailable();
  }

  async queryClinicalRecords(): Promise<never> {
    return unavailable();
  }

  async queryAudiograms(): Promise<never> {
    return unavailable();
  }

  async queryWorkoutRoute(): Promise<never> {
    return unavailable();
  }

  async queryCorrelations(): Promise<never> {
    return unavailable();
  }

  async queryHeartbeatSeries(): Promise<never> {
    return unavailable();
  }

  async queryStatistics(): Promise<never> {
    return unavailable();
  }

  async queryStatisticsCollection(): Promise<never> {
    return unavailable();
  }

  async queryAnchored(): Promise<never> {
    return unavailable();
  }

  async saveQuantitySample(): Promise<string> {
    return unavailable();
  }

  async saveCategorySample(): Promise<string> {
    return unavailable();
  }

  async saveWorkout(): Promise<string> {
    return unavailable();
  }

  async saveCorrelation(): Promise<string> {
    return unavailable();
  }

  async deleteObjects(): Promise<number> {
    return unavailable();
  }

  async getBiologicalSex(): Promise<number> {
    return unavailable();
  }

  async getBloodType(): Promise<number> {
    return unavailable();
  }

  async getDateOfBirth(): Promise<string | null> {
    return unavailable();
  }

  async getFitzpatrickSkinType(): Promise<number> {
    return unavailable();
  }

  async getWheelchairUse(): Promise<number> {
    return unavailable();
  }

  async enableBackgroundDelivery(): Promise<boolean> {
    return unavailable();
  }

  async disableBackgroundDelivery(): Promise<boolean> {
    return unavailable();
  }

  async disableAllBackgroundDelivery(): Promise<boolean> {
    return unavailable();
  }

  async observeTypes(): Promise<void> {
    return unavailable();
  }

  async clearObserverQueries(): Promise<void> {
    return unavailable();
  }
}

export default registerWebModule(ExpoHealthKitModule, 'ExpoHealthKitModule');
