import { nativeParseLocalDate } from './native-local-date-parsing';

describe('native-local-date-parsing', () => {
  it('Given a valid calendar date, When parsing it, Then it preserves the calendar fields', () => {
    expect(nativeParseLocalDate('2026-08-20')).toEqual({
      kind: 'local-date',
      year: 2026,
      month: 8,
      day: 20,
    });
  });

  it('Given a structured local date, When parsing it, Then it returns the normalized value', () => {
    const value = {
      kind: 'local-date' as const,
      year: 2026,
      month: 8,
      day: 20,
    };

    expect(nativeParseLocalDate(value)).toEqual(value);
    expect(nativeParseLocalDate(value)).not.toBe(value);
  });

  it('Given a structured local date with invalid fields, When parsing it, Then it raises a range error', () => {
    expect(() =>
      nativeParseLocalDate({
        kind: 'local-date',
        year: 2026,
        month: 2,
        day: 29,
      }),
    ).toThrow(RangeError);
  });

  it.each([
    { kind: 'local-date', month: 8, day: 20 },
    { kind: 'local-date', year: 2026, day: 20 },
    { kind: 'local-date', year: 2026, month: 8 },
  ])(
    'Given a structured local date with a missing numeric field (%s), When parsing it, Then it raises a range error',
    (value) => {
      expect(() => nativeParseLocalDate(value as never)).toThrow(RangeError);
    },
  );

  it.each([
    {},
    { year: 2026, month: 8, day: 20 },
    { kind: 'instant', year: 2026, month: 8, day: 20 },
    { kind: 'local-date', year: '2026', month: 8, day: 20 },
    null,
    undefined,
    { kind: 'local-date', year: Number.NaN, month: 8, day: 20 },
    { kind: 'local-date', year: Number.POSITIVE_INFINITY, month: 8, day: 20 },
    { kind: 'local-date', year: Number.NEGATIVE_INFINITY, month: 8, day: 20 },
  ])(
    'Given a structurally invalid local date object %s, When parsing it, Then it raises a range error',
    (value) => {
      expect(() => nativeParseLocalDate(value as never)).toThrow(RangeError);
    },
  );

  it.each(['2026-13-01', '2026-02-29', 'not-a-date', ''])(
    'Given invalid date %s, When parsing it, Then it raises a range error',
    (value) => {
      expect(() => nativeParseLocalDate(value)).toThrow(RangeError);
    },
  );

  it.each([' 2026-08-20', '2026-08-20 ', '2026/08/20', '2026-08-20✨'])(
    'Given a date string with whitespace or special characters (%s), When parsing it, Then it raises a range error',
    (value) => {
      expect(() => nativeParseLocalDate(value)).toThrow(RangeError);
    },
  );
});
