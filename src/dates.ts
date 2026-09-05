import type { DateInput } from './types';

export function toIso(value: DateInput): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function toOptionalIso(value?: DateInput): string | undefined {
  return value == null ? undefined : toIso(value);
}

export function fromIso(value: string): Date {
  return new Date(value);
}

export function resolveEndDate(startDate: DateInput, endDate?: DateInput): string {
  return toIso(endDate ?? startDate);
}
