import { TestBed } from '@angular/core/testing';
import { provideTankOsTime } from '../composition';
import { TimeService } from './time-service';

describe('time-service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTankOsTime()] });
  });

  it('Given an ISO instant, When parsing it through Angular, Then it returns an Instant', () => {
    expect(
      TestBed.inject(TimeService).parseInstant('2026-08-20T15:30:00Z'),
    ).toEqual({
      kind: 'instant',
      epochMilliseconds: Date.parse('2026-08-20T15:30:00.000Z'),
    });
  });

  it.each([0, -1, { kind: 'instant', epochMilliseconds: 0 }])(
    'Given supported instant value %s, When parsing it through Angular, Then it returns an Instant',
    (value) => {
      expect(TestBed.inject(TimeService).parseInstant(value as never)).toEqual({
        kind: 'instant',
        epochMilliseconds: value === -1 ? -1 : 0,
      });
    },
  );

  it.each([
    'not-an-instant',
    '',
    null,
    undefined,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])(
    'Given invalid instant value %s, When validating it through Angular, Then it returns false',
    (value) => {
      expect(TestBed.inject(TimeService).isValidInstant(value)).toBe(false);
    },
  );

  it('Given an offset instant, When serializing it through Angular, Then it returns UTC ISO notation', () => {
    expect(
      TestBed.inject(TimeService).toUtcIsoString('2026-08-20T15:30:00+01:00'),
    ).toBe('2026-08-20T14:30:00.000Z');
  });

  it.each([0, -1, { kind: 'instant', epochMilliseconds: 0 }])(
    'Given supported instant value %s, When serializing it through Angular, Then it returns UTC ISO notation',
    (value) => {
      expect(
        TestBed.inject(TimeService).toUtcIsoString(value as never),
      ).toMatch(/Z$/);
    },
  );

  it('Given a calendar date, When parsing it through Angular, Then it remains independent from time zones', () => {
    expect(TestBed.inject(TimeService).parseLocalDate('2026-08-20')).toEqual({
      kind: 'local-date',
      year: 2026,
      month: 8,
      day: 20,
    });
  });

  it('Given an empty calendar date, When parsing it through Angular, Then it raises a range error', () => {
    expect(() => TestBed.inject(TimeService).parseLocalDate('')).toThrow(
      RangeError,
    );
  });

  it.each(['2026-02-29', '', null, undefined, 20260820])(
    'Given invalid calendar value %s, When validating it through Angular, Then it returns false',
    (value) => {
      expect(TestBed.inject(TimeService).isValidLocalDate(value)).toBe(false);
    },
  );

  it('Given a local date-time and zone, When resolving it through Angular, Then it returns the corresponding instant', () => {
    expect(
      TestBed.inject(TimeService).fromZonedDateTime(
        '2026-08-20T15:30:00',
        'Atlantic/Canary',
      ),
    ).toEqual({
      kind: 'instant',
      epochMilliseconds: Date.parse('2026-08-20T14:30:00.000Z'),
    });
  });

  it('Given a local date-time and zone, When resolving with origin through Angular, Then it retains the source zone metadata', () => {
    expect(
      TestBed.inject(TimeService).resolveZonedDateTime(
        '2026-08-20T15:30:00',
        'Atlantic/Canary',
      ),
    ).toEqual({
      instant: {
        kind: 'instant',
        epochMilliseconds: Date.parse('2026-08-20T14:30:00.000Z'),
      },
      origin: {
        sourceTimeZone: 'Atlantic/Canary',
        resolvedOffsetMinutes: 60,
      },
    });
  });

  it('Given a local date-time and offset, When resolving with origin through Angular, Then it retains the source offset', () => {
    expect(
      TestBed.inject(TimeService).resolveOffsetDateTime(
        '2026-08-20T15:30:00',
        60,
      ),
    ).toEqual({
      instant: {
        kind: 'instant',
        epochMilliseconds: Date.parse('2026-08-20T14:30:00.000Z'),
      },
      origin: {
        sourceOffsetMinutes: 60,
        resolvedOffsetMinutes: 60,
      },
    });
  });

  it.each([
    ['', 'Atlantic/Canary'],
    ['2026-08-20T15:30:00', ''],
  ])(
    'Given invalid zoned date-time value %s/%s, When resolving it through Angular, Then it raises a range error',
    (value, timeZone) => {
      expect(() =>
        TestBed.inject(TimeService).fromZonedDateTime(value, timeZone),
      ).toThrow(RangeError);
    },
  );

  it.each(['Not/A_Time_Zone', '', '   ', ' UTC', 'UTC ', 'Europe/Pa✨ris'])(
    'Given invalid IANA zone %s, When validating it through Angular, Then it returns false',
    (timeZone) => {
      expect(TestBed.inject(TimeService).isValidTimeZone(timeZone)).toBe(false);
    },
  );

  it('Given an elapsed duration, When parsing it through Angular, Then it returns normalized milliseconds', () => {
    expect(TestBed.inject(TimeService).parseDuration('PT1H30M')).toEqual({
      kind: 'duration',
      milliseconds: 5_400_000,
    });
  });

  it.each([0, -1, { kind: 'duration', milliseconds: 1_500 }])(
    'Given supported duration value %s, When serializing it through Angular, Then it returns canonical ISO notation',
    (value) => {
      expect(
        TestBed.inject(TimeService).toDurationIsoString(value as never),
      ).toMatch(/^-?P/);
    },
  );

  it.each(['P1Y', 'P1M', 'PT', '', null, undefined, Number.NaN])(
    'Given invalid duration value %s, When validating it through Angular, Then it returns false',
    (value) => {
      expect(TestBed.inject(TimeService).isValidDuration(value)).toBe(false);
    },
  );
});
