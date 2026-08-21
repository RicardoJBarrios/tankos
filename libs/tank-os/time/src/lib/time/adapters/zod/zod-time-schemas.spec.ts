import { createNativeTimeAdapter } from '../native';
import { createNativeTimeZoneDatabase } from '../native';
import { createZodTimeSchemas } from './zod-time-schemas';

describe('createZodTimeSchemas', () => {
  const schemas = createZodTimeSchemas(
    createNativeTimeAdapter(),
    createNativeTimeZoneDatabase(),
  );

  it('Given a valid instant string, When parsed, Then returns a normalized Instant', () => {
    expect(schemas.instant.parse('2026-08-20T15:30:01.250Z')).toEqual({
      kind: 'instant',
      epochMilliseconds: Date.parse('2026-08-20T15:30:01.250Z'),
    });
  });

  it.each([null, undefined, 0, '', 'not-an-instant'])(
    'Given an invalid instant %s, When parsed, Then rejects it',
    (value) => {
      expect(schemas.instant.safeParse(value).success).toBe(false);
    },
  );

  it('Given a parser that throws an empty error, When parsed, Then reports the fallback label', () => {
    const nativeTime = createNativeTimeAdapter();
    const throwingTime = {
      ...nativeTime,
      parseInstant: () => {
        throw '';
      },
    };
    const throwingSchemas = createZodTimeSchemas(
      throwingTime,
      createNativeTimeZoneDatabase(),
    );

    expect(throwingSchemas.instant.safeParse('2026-08-20T00:00:00Z')).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          issues: [expect.objectContaining({ message: 'Invalid instant' })],
        }),
      }),
    );
  });

  it('Given a valid local date string, When parsed, Then returns a LocalDate', () => {
    expect(schemas.localDate.parse('2026-08-20')).toEqual({
      kind: 'local-date',
      year: 2026,
      month: 8,
      day: 20,
    });
  });

  it.each([null, undefined, 20260820, '2026-02-29', '2026-08-20 '])(
    'Given an invalid local date %s, When parsed, Then rejects it',
    (value) => {
      expect(schemas.localDate.safeParse(value).success).toBe(false);
    },
  );

  it('Given a valid duration string, When parsed, Then returns millisecond precision', () => {
    expect(schemas.duration.parse('PT1.5S')).toEqual({
      kind: 'duration',
      milliseconds: 1_500,
    });
  });

  it.each([null, undefined, 1_500, 'PT', 'P1M'])(
    'Given an invalid duration %s, When parsed, Then rejects it',
    (value) => {
      expect(schemas.duration.safeParse(value).success).toBe(false);
    },
  );

  it('Given sub-millisecond duration precision, When parsed, Then truncates to milliseconds', () => {
    expect(schemas.duration.parse('PT1.0009S')).toEqual({
      kind: 'duration',
      milliseconds: 1_000,
    });
  });

  it.each(['UTC', 'Europe/Madrid'])(
    'Given a supported time zone %s, When parsed, Then accepts it',
    (value) => {
      expect(schemas.timeZone.parse(value)).toBe(value);
    },
  );

  it.each(['', 'Not/AZone', null, undefined, 25])(
    'Given an invalid time zone %s, When parsed, Then rejects it',
    (value) => {
      expect(schemas.timeZone.safeParse(value).success).toBe(false);
    },
  );
});
