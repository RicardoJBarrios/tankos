import { describe, expect, it } from 'vitest';
import { currentDateTimeLocal } from './date-time-input';

describe('currentDateTimeLocal', () => {
  it('formats a date for a datetime-local control in local time', () => {
    const input = new Date('2026-08-16T12:34:56.000Z');
    const expected = new Date(
      input.getTime() - input.getTimezoneOffset() * 60_000,
    )
      .toISOString()
      .slice(0, 16);

    expect(currentDateTimeLocal(input)).toBe(expected);
  });
});
