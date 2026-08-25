import { describe, expect, it } from 'vitest';
import { classifyPlannedCareTiming } from './planned-care-timing';

const now = new Date('2026-08-10T10:00:00.000Z');

describe('classifyPlannedCareTiming', () => {
  it('classifies future care as upcoming', () => {
    expect(
      classifyPlannedCareTiming(new Date('2026-08-10T10:00:00.001Z'), now),
    ).toBe('upcoming');
  });

  it('classifies the exact current instant as upcoming', () => {
    expect(classifyPlannedCareTiming(now, now)).toBe('upcoming');
  });

  it('classifies one millisecond before now as overdue', () => {
    expect(
      classifyPlannedCareTiming(new Date('2026-08-10T09:59:59.999Z'), now),
    ).toBe('overdue');
  });

  it('classifies clearly overdue care as overdue', () => {
    expect(
      classifyPlannedCareTiming(new Date('2026-08-08T10:00:00.000Z'), now),
    ).toBe('overdue');
  });

  it('uses the same rule for manual and recurring occurrences', () => {
    const manual = new Date('2026-08-08T10:00:00.000Z');
    const recurring = new Date('2026-08-12T10:00:00.000Z');

    expect(classifyPlannedCareTiming(manual, now)).toBe('overdue');
    expect(classifyPlannedCareTiming(recurring, now)).toBe('upcoming');
  });
});
