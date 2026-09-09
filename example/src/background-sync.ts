import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as HealthKit from '@appeeky/expo-healthkit';

import { startOfToday } from '@/src/health';

const OBSERVED_TYPES: string[] = [HealthKit.QuantityType.stepCount, HealthKit.QuantityType.heartRate];

export interface BackgroundUpdate {
  type: string;
  receivedAt: Date;
  /** Result of the re-query, formatted for display. */
  summary: string;
  durationMs: number;
}

// Kept in memory only: survives navigation, not process death. Good enough to
// verify that deliveries reach JS while the app is alive after a background wake.
const updates: BackgroundUpdate[] = [];
const subscribers = new Set<() => void>();

function notify(): void {
  for (const subscriber of subscribers) subscriber();
}

function log(message: string, extra?: unknown): void {
  const stamp = new Date().toISOString();
  if (extra === undefined) {
    console.log(`[bg-sync ${stamp}] ${message}`);
  } else {
    console.log(`[bg-sync ${stamp}] ${message}`, extra);
  }
}

async function requery(type: string): Promise<string> {
  if (type === HealthKit.QuantityType.heartRate) {
    const stats = await HealthKit.queryStatistics({
      type,
      unit: HealthKit.Unit.countPerMinute,
      from: startOfToday(),
      options: HealthKit.StatisticsOption.discreteMostRecent,
    });
    return stats.mostRecent == null ? 'no HR today' : `${Math.round(stats.mostRecent)} BPM`;
  }
  const stats = await HealthKit.queryStatistics({
    type,
    unit: HealthKit.Unit.count,
    from: startOfToday(),
    options: HealthKit.StatisticsOption.cumulativeSum,
  });
  return `${Math.round(stats.sum ?? 0).toLocaleString()} steps today`;
}

// Observers and background delivery are HealthKit-only; Health Connect has no equivalent.
const supportsBackgroundDelivery = Platform.OS === 'ios';

// Module scope: must exist before iOS delivers a queued background update on cold start.
if (supportsBackgroundDelivery && HealthKit.isAvailable()) {
  HealthKit.addUpdateListener(async ({ type }) => {
    const startedAt = Date.now();
    log(`update received for ${type}`);
    let summary: string;
    try {
      summary = await requery(type);
    } catch (error) {
      summary = `re-query failed: ${String(error)}`;
    }
    // Simulate async work (upload) so the held completion handler is exercised.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    updates.unshift({ type, receivedAt: new Date(), summary, durationMs: Date.now() - startedAt });
    if (updates.length > 20) updates.pop();
    notify();
    log(`processed ${type}`, summary);
  });
  log('listener registered');
}

/** Call after authorization. Idempotent. */
export async function enableBackgroundSync(): Promise<void> {
  if (!supportsBackgroundDelivery || !HealthKit.isAvailable()) return;
  await HealthKit.observe(OBSERVED_TYPES);
  for (const type of OBSERVED_TYPES) {
    await HealthKit.enableBackgroundDelivery(type, HealthKit.UpdateFrequency.immediate);
  }
  log('background delivery enabled', await HealthKit.getObservedTypes());
}

export function isBackgroundObserved(type: string): boolean {
  return supportsBackgroundDelivery && OBSERVED_TYPES.includes(type);
}

export function useBackgroundUpdates(type?: string): BackgroundUpdate[] {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const subscriber = () => setVersion((value) => value + 1);
    subscribers.add(subscriber);
    return () => {
      subscribers.delete(subscriber);
    };
  }, []);

  return type ? updates.filter((update) => update.type === type) : updates;
}
