import { describe, expect, it } from 'vitest';
import { formatUnitValue } from './format-unit-value';

describe('formatUnitValue', () => {
  it.each([
    ['12 L', 12, { symbol: 'L', position: 'suffix', spacing: 'narrow' }],
    ['$12', 12, { symbol: '$', position: 'prefix', spacing: 'none' }],
    ['12 dKH', 12, { symbol: 'dKH', position: 'suffix', spacing: 'normal' }],
  ])('formats %s', (expected, value, representation) => {
    expect(formatUnitValue(value, representation)).toBe(expected);
  });
});
