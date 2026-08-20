import { createNativeTimeDisplayAdapter } from './native-time-display-adapter';

describe('native-time-display-adapter', () => {
  const adapter = createNativeTimeDisplayAdapter();

  it('Given an instant, When formatting it with defaults, Then it returns a localized date and time', () => {
    expect(
      adapter.formatInstant('2026-08-20T15:30:00Z', { locale: 'en-GB' }),
    ).toContain('20 Aug 2026');
  });

  it('Given an instant and display options, When formatting it, Then it applies locale, zone and styles', () => {
    expect(
      adapter.formatInstant('2026-08-20T15:30:00Z', {
        locale: 'en-US',
        timeZone: 'Atlantic/Canary',
        dateStyle: 'full',
        timeStyle: 'short',
      }),
    ).toContain('Thursday');
  });

  it.each([0, { kind: 'instant', epochMilliseconds: 0 }])(
    'Given supported instant value %s, When formatting it, Then it returns a display string',
    (value) => {
      expect(
        adapter.formatInstant(value as never, { locale: 'en-GB' }),
      ).toContain('1970');
    },
  );

  it('Given a local date string, When formatting it, Then it does not shift the calendar day', () => {
    expect(
      adapter.formatLocalDate('2026-08-20', {
        locale: 'en-GB',
        dateStyle: 'long',
      }),
    ).toContain('20 August 2026');
  });

  it('Given a structured local date, When formatting it, Then it renders the same calendar date', () => {
    expect(
      adapter.formatLocalDate(
        { kind: 'local-date', year: 2026, month: 8, day: 20 },
        { locale: 'en-GB', dateStyle: 'short' },
      ),
    ).toContain('20/08/2026');
  });

  it('Given an invalid instant, When formatting it, Then it raises a range error', () => {
    expect(() => adapter.formatInstant('not-an-instant')).toThrow(RangeError);
  });

  it.each(['', Number.NaN, Number.POSITIVE_INFINITY, null, undefined])(
    'Given invalid instant value %s, When formatting it, Then it raises an error',
    (value) => {
      expect(() => adapter.formatInstant(value as never)).toThrow();
    },
  );

  it.each(['', null, undefined])(
    'Given invalid local date value %s, When formatting it, Then it raises an error',
    (value) => {
      expect(() => adapter.formatLocalDate(value as never)).toThrow();
    },
  );
});
