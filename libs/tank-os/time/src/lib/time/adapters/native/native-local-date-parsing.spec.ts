import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-local-date-parsing', () => {
  const adapter = createNativeTimeAdapter();

  it('Given a valid calendar date, When parsing it, Then it preserves the calendar fields', () => {
    expect(adapter.parseLocalDate('2026-08-20')).toEqual({
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

    expect(adapter.parseLocalDate(value)).toBe(value);
  });

  it('Given a structured local date with invalid fields, When parsing it, Then it raises a range error', () => {
    expect(() =>
      adapter.parseLocalDate({
        kind: 'local-date',
        year: 2026,
        month: 2,
        day: 29,
      }),
    ).toThrow(RangeError);
  });

  it.each([
    {},
    { year: 2026, month: 8, day: 20 },
    { kind: 'instant', year: 2026, month: 8, day: 20 },
    { kind: 'local-date', year: '2026', month: 8, day: 20 },
    null,
    undefined,
  ])(
    'Given a structurally invalid local date object %s, When parsing it, Then it raises a range error',
    (value) => {
      expect(() => adapter.parseLocalDate(value as never)).toThrow(RangeError);
    },
  );

  it.each(['2026-13-01', '2026-02-29', 'not-a-date', ''])(
    'Given invalid date %s, When parsing it, Then it raises a range error',
    (value) => {
      expect(() => adapter.parseLocalDate(value)).toThrow(RangeError);
    },
  );

  it.each([' 2026-08-20', '2026-08-20 ', '2026/08/20', '2026-08-20✨'])(
    'Given a date string with whitespace or special characters (%s), When parsing it, Then it raises a range error',
    (value) => {
      expect(() => adapter.parseLocalDate(value)).toThrow(RangeError);
    },
  );
});
