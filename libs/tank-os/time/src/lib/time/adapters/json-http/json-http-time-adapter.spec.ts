import { createNativeTimeAdapter } from '../native';
import { createJsonHttpTimeAdapter } from './json-http-time-adapter';

describe('json-http-time-adapter', () => {
  const adapter = createJsonHttpTimeAdapter(createNativeTimeAdapter());

  it.each([
    '2026-08-20T17:30:01.25+02:00',
    1787239801250,
    { kind: 'instant', epochMilliseconds: 1787239801250 } as const,
  ])(
    'Given an instant %s, When serializing it for JSON, Then it returns canonical UTC ISO with milliseconds',
    (value) => {
      expect(adapter.serializeInstant(value)).toBe('2026-08-20T15:30:01.250Z');
    },
  );

  it('Given a canonical ISO instant, When deserializing it, Then it returns the normalized instant', () => {
    expect(adapter.deserializeInstant('2026-08-20T15:30:01.250Z')).toEqual({
      kind: 'instant',
      epochMilliseconds: Date.parse('2026-08-20T15:30:01.250Z'),
    });
  });

  it('Given a valid instant, When serializing it and deserializing it, Then the temporal value is preserved', () => {
    const value = '2026-08-20T15:30:01.250Z';

    expect(adapter.deserializeInstant(adapter.serializeInstant(value))).toEqual(
      {
        kind: 'instant',
        epochMilliseconds: Date.parse(value),
      },
    );
  });

  it.each([
    '2026-08-20',
    { kind: 'local-date', year: 2026, month: 8, day: 20 } as const,
  ])(
    'Given a local date %s, When serializing it for JSON, Then it returns YYYY-MM-DD without a timezone',
    (value) => {
      expect(adapter.serializeLocalDate(value)).toBe('2026-08-20');
    },
  );

  it('Given a JSON local date, When deserializing it, Then it returns a LocalDate', () => {
    expect(adapter.deserializeLocalDate('2026-08-20')).toEqual({
      kind: 'local-date',
      year: 2026,
      month: 8,
      day: 20,
    });
  });

  it('Given a valid local date, When serializing it and deserializing it, Then the calendar value is preserved', () => {
    const value = '2026-08-20';

    expect(
      adapter.deserializeLocalDate(adapter.serializeLocalDate(value)),
    ).toEqual({
      kind: 'local-date',
      year: 2026,
      month: 8,
      day: 20,
    });
  });

  it.each([
    ['PT1H30M', 'PT1H30M'],
    [90_000, 'PT1M30S'],
    [{ kind: 'duration', milliseconds: -1_500 }, '-PT1.5S'],
  ])(
    'Given a duration %s, When serializing it for JSON, Then it returns %s',
    (value, expected) => {
      expect(adapter.serializeDuration(value as never)).toBe(expected);
    },
  );

  it('Given a JSON duration, When deserializing it, Then it returns normalized milliseconds', () => {
    expect(adapter.deserializeDuration('P1DT1S')).toEqual({
      kind: 'duration',
      milliseconds: 86_401_000,
    });
  });

  it.each([null, undefined, 0, {}, '2026-08-20'])(
    'Given an invalid JSON instant %s, When deserializing it, Then it raises a range error',
    (value) => {
      expect(() => adapter.deserializeInstant(value)).toThrow(RangeError);
    },
  );

  it.each([null, undefined, 20260820, '2026-08-20 ', '2026-02-29'])(
    'Given an invalid JSON local date %s, When deserializing it, Then it raises a range error',
    (value) => {
      expect(() => adapter.deserializeLocalDate(value)).toThrow(RangeError);
    },
  );

  it.each([null, undefined, 0, {}, 'PT', 'P1M', 'PT1Y'])(
    'Given an invalid JSON duration %s, When deserializing it, Then it raises a range error',
    (value) => {
      expect(() => adapter.deserializeDuration(value)).toThrow(RangeError);
    },
  );
});
