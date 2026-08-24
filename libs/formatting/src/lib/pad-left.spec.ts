import { describe, expect, it } from 'vitest';
import { padLeft } from './pad-left';

describe('padLeft', () => {
  it.each([
    ['7', 2, '0', '07'],
    ['', 3, '0', '000'],
    ['abc', 2, '0', 'abc'],
    ['x', 3, '🙂', '🙂x'],
    ['  ', 3, '_', '_  '],
  ])(
    'Given %j and width %d, When padded, Then returns %j',
    (input, width, fill, expected) => {
      expect(padLeft(input, width, fill)).toBe(expected);
    },
  );

  it.each([
    [-1, '0'],
    [1.5, '0'],
    [Number.NaN, '0'],
    [2, ''],
    [2, 'ab'],
  ])(
    'Given invalid padding arguments %j and %j, Then throws RangeError',
    (width, fill) => {
      expect(() => padLeft('x', width, fill)).toThrow(RangeError);
    },
  );
});
