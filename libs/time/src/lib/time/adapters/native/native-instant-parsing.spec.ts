import { nativeParseInstant } from './native-instant-parsing';

describe('native-instant-parsing', () => {
  it('Given an ISO instant with an offset, When parsing it, Then it returns the normalized epoch value', () => {
    expect(nativeParseInstant('2026-08-20T15:30:00+01:00')).toEqual({
      kind: 'instant',
      epochMilliseconds: Date.parse('2026-08-20T14:30:00.000Z'),
    });
  });

  it('Given epoch zero, When parsing it, Then it accepts the boundary value', () => {
    expect(nativeParseInstant(0)).toEqual({
      kind: 'instant',
      epochMilliseconds: 0,
    });
  });

  it('Given a negative epoch value, When parsing it, Then it accepts it as a valid instant', () => {
    expect(nativeParseInstant(-1)).toEqual({
      kind: 'instant',
      epochMilliseconds: -1,
    });
  });

  it('Given nanosecond ISO precision, When parsing it, Then it truncates after milliseconds', () => {
    expect(nativeParseInstant('2026-08-20T15:30:01.250999999Z')).toEqual({
      kind: 'instant',
      epochMilliseconds: Date.parse('2026-08-20T15:30:01.250Z'),
    });
  });

  it('Given a previously parsed instant object, When parsing it, Then it preserves its epoch value', () => {
    expect(
      nativeParseInstant({ kind: 'instant', epochMilliseconds: 0 }),
    ).toEqual({
      kind: 'instant',
      epochMilliseconds: 0,
    });
  });

  it.each([
    {},
    { epochMilliseconds: 0 },
    { kind: 'local-date', epochMilliseconds: 0 },
    { kind: 'instant', epochMilliseconds: '0' },
    null,
    undefined,
  ])(
    'Given a structurally invalid instant object %s, When parsing it, Then it raises a range error',
    (value) => {
      expect(() => nativeParseInstant(value as never)).toThrow(RangeError);
    },
  );

  it.each([
    '2026-08-20T15:30:00',
    '2026-02-30T15:30:00Z',
    '2026-08-20T24:00:00Z',
    '2026-08-20T15:60:00Z',
    '2026-08-20T15:30:60Z',
    '2026-08-20T15:30:00+24:00',
    '2026-08-20T15:30:00+01:60',
  ])(
    'Given malformed value %s, When parsing it, Then it raises a range error',
    (value) => {
      expect(() => nativeParseInstant(value)).toThrow(RangeError);
    },
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'Given invalid epoch value %s, When parsing it, Then it raises a range error',
    (value) => {
      expect(() => nativeParseInstant(value)).toThrow(RangeError);
    },
  );

  it('Given an epoch outside the native Date range, When parsing it, Then raises a range error', () => {
    expect(() => nativeParseInstant(8_640_000_000_000_001)).toThrow(RangeError);
  });

  it('Given fractional epoch milliseconds, When parsing it, Then it truncates toward zero', () => {
    expect(nativeParseInstant(-1.9)).toEqual({
      kind: 'instant',
      epochMilliseconds: -1,
    });
  });

  it('Given an empty string, When parsing it, Then it raises a range error', () => {
    expect(() => nativeParseInstant('')).toThrow(RangeError);
  });

  it.each([
    ' 2026-08-20T15:30:00Z',
    '2026-08-20T15:30:00Z ',
    '2026/08/20T15:30:00Z',
    '2026-08-20T15:30:00Z✨',
  ])(
    'Given an instant string with whitespace or special characters (%s), When parsing it, Then it raises a range error',
    (value) => {
      expect(() => nativeParseInstant(value)).toThrow(RangeError);
    },
  );
});
