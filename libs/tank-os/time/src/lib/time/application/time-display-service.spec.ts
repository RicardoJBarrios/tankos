import { TestBed } from '@angular/core/testing';
import { TimeDisplayService } from './time-display-service';

describe('time-display-service', () => {
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
        dateStyle: 'long',
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
});
