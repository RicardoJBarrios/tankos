import { describe, expect, it } from 'vitest';
import { trimTrailingZeros } from './trim-trailing-zeros';

describe('trimTrailingZeros', () => {
  it.each([
    ['', ''],
    ['1200', '12'],
    ['12.3000', '12.3'],
    ['000', ''],
    [' 1200 ', ' 1200 '],
    ['12٠٠', '12٠٠'],
    ['-0', '-'],
  ])(
    'Given %j, When trailing zeros are trimmed, Then returns %j',
    (input, expected) => {
      expect(trimTrailingZeros(input)).toBe(expected);
    },
  );
});
