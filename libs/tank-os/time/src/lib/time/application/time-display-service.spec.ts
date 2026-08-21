import { TestBed } from '@angular/core/testing';
import { provideTankOsTime } from '../composition';
import { TimeDisplayService } from './time-display-service';

describe('time-display-service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTankOsTime()] });
  });

  it('Given an instant, When formatting it through Angular, Then it returns a display string', () => {
    expect(
      TestBed.inject(TimeDisplayService).formatInstant('2026-08-20T15:30:00Z', {
        locale: 'en-US',
      }),
    ).toContain('Aug 20, 2026');
  });

  it.each([0, { kind: 'instant', epochMilliseconds: 0 }])(
    'Given supported instant value %s, When formatting it through Angular, Then it returns a display string',
    (value) => {
      expect(
        TestBed.inject(TimeDisplayService).formatInstant(value as never, {
          locale: 'en-US',
        }),
      ).toContain('1970');
    },
  );

  it('Given a local date, When formatting it through Angular, Then it preserves the calendar date', () => {
    expect(
      TestBed.inject(TimeDisplayService).formatLocalDate('2026-08-20', {
        locale: 'en-US',
        format: 'longDate',
      }),
    ).toContain('August 20, 2026');
  });

  it('Given a structured local date, When formatting it through Angular, Then it preserves the calendar date', () => {
    expect(
      TestBed.inject(TimeDisplayService).formatLocalDate({
        kind: 'local-date',
        year: 2026,
        month: 8,
        day: 20,
      }),
    ).toContain('Aug 20, 2026');
  });

  it('Given a duration, When formatting it through Angular, Then it returns a localized display string', () => {
    expect(
      TestBed.inject(TimeDisplayService).formatDuration(5_400_000, {
        locale: 'en-US',
      }),
    ).toBe('1 hr, 30 min');
  });
});
