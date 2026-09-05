import { fromIso, resolveEndDate, toIso, toOptionalIso } from '../dates';

describe('date helpers', () => {
  it('serializes Date values to ISO-8601', () => {
    const date = new Date('2024-01-15T12:00:00.000Z');
    expect(toIso(date)).toBe('2024-01-15T12:00:00.000Z');
    expect(toIso('2024-01-15T12:00:00.000Z')).toBe('2024-01-15T12:00:00.000Z');
  });

  it('round-trips ISO strings', () => {
    const iso = '2024-01-15T12:00:00.000Z';
    expect(fromIso(iso).toISOString()).toBe(iso);
  });

  it('defaults the end date to the start date', () => {
    const start = new Date('2024-01-15T12:00:00.000Z');
    expect(resolveEndDate(start)).toBe(start.toISOString());
    expect(toOptionalIso(undefined)).toBeUndefined();
  });

  it('accepts an explicit end date and optional Date values', () => {
    const start = new Date('2024-01-15T12:00:00.000Z');
    const end = new Date('2024-01-15T13:00:00.000Z');
    expect(resolveEndDate(start, end)).toBe(end.toISOString());
    expect(toOptionalIso(start)).toBe(start.toISOString());
  });
});
