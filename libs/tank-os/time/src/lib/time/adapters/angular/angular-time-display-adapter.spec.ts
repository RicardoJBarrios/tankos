import { DatePipe } from '@angular/common';
import { createNativeTimeAdapter } from '../native';
import { createAngularTimeDisplayAdapter } from './angular-time-display-adapter';

describe('angular-time-display-adapter', () => {
  const timeAdapter = createNativeTimeAdapter();

  it('Given an instant, When formatting it, Then it delegates the epoch, format and UTC zone to DatePipe', () => {
    const datePipe = new DatePipe('en-GB');
    const transform = vi
      .spyOn(datePipe, 'transform')
      .mockReturnValue('formatted');
    const adapter = createAngularTimeDisplayAdapter(datePipe, timeAdapter);

    expect(
      adapter.formatInstant('2026-08-20T15:30:00Z', {
        format: 'full',
        timeZone: 'UTC',
        locale: 'es-ES',
      }),
    ).toBe('formatted');
    expect(transform).toHaveBeenCalledWith(
      Date.parse('2026-08-20T15:30:00.000Z'),
      'full',
      '+0000',
      'es-ES',
    );
  });

  it('Given a replacement temporal port, When formatting an instant, Then it uses that port instead of native parsing', () => {
    const datePipe = new DatePipe('en-GB');
    const replacementAdapter = createNativeTimeAdapter();
    vi.spyOn(datePipe, 'transform').mockReturnValue('formatted');
    const parseInstant = vi
      .spyOn(replacementAdapter, 'parseInstant')
      .mockReturnValue({ kind: 'instant', epochMilliseconds: 1234 });
    const adapter = createAngularTimeDisplayAdapter(
      datePipe,
      replacementAdapter,
    );

    adapter.formatInstant('2026-08-20T15:30:00Z');

    expect(parseInstant).toHaveBeenCalledWith('2026-08-20T15:30:00Z');
  });

  it('Given an aquarium IANA timezone, When formatting an instant, Then it resolves the offset at that instant before delegating', () => {
    const datePipe = new DatePipe('en-GB');
    const transform = vi
      .spyOn(datePipe, 'transform')
      .mockReturnValue('formatted');
    const adapter = createAngularTimeDisplayAdapter(datePipe, timeAdapter);

    adapter.formatInstant('2026-08-20T12:00:00Z', {
      format: 'medium',
      timeZone: 'Europe/Madrid',
    });

    expect(transform).toHaveBeenCalledWith(
      Date.parse('2026-08-20T12:00:00.000Z'),
      'medium',
      '+0200',
      undefined,
    );
  });

  it('Given no explicit timezone, When formatting an instant, Then it uses the configured fallback timezone', () => {
    const datePipe = new DatePipe('en-GB');
    const transform = vi
      .spyOn(datePipe, 'transform')
      .mockReturnValue('formatted');
    const adapter = createAngularTimeDisplayAdapter(
      datePipe,
      timeAdapter,
      'Atlantic/Canary',
    );

    adapter.formatInstant(0, { format: 'short' });

    expect(transform).toHaveBeenCalledWith(0, 'short', '+0000', undefined);
  });

  it('Given a local date, When formatting it, Then it always delegates with UTC to preserve the calendar day', () => {
    const datePipe = new DatePipe('en-GB');
    const transform = vi.spyOn(datePipe, 'transform').mockReturnValue('date');
    const adapter = createAngularTimeDisplayAdapter(datePipe, timeAdapter);

    expect(
      adapter.formatLocalDate('2026-08-20', {
        format: 'fullDate',
        timeZone: 'Europe/Madrid',
      }),
    ).toBe('date');
    expect(transform).toHaveBeenCalledWith(
      Date.parse('2026-08-20T00:00:00.000Z'),
      'fullDate',
      '+0000',
      undefined,
    );
  });

  it('Given a local date in the first century, When formatting it, Then it preserves the actual year', () => {
    const datePipe = new DatePipe('en-GB');
    const transform = vi.spyOn(datePipe, 'transform').mockReturnValue('date');
    const adapter = createAngularTimeDisplayAdapter(datePipe, timeAdapter);

    adapter.formatLocalDate('0001-01-02');

    expect(transform).toHaveBeenCalledWith(
      Date.parse('0001-01-02T00:00:00.000Z'),
      'mediumDate',
      '+0000',
      undefined,
    );
  });

  it('Given a formatter that returns no local-date result, When formatting it, Then it returns an empty string', () => {
    const datePipe = new DatePipe('en-GB');
    vi.spyOn(datePipe, 'transform').mockReturnValue(null);
    const adapter = createAngularTimeDisplayAdapter(datePipe, timeAdapter);

    expect(adapter.formatLocalDate('2026-08-20')).toBe('');
  });

  it('Given a formatter that returns no instant result, When formatting it, Then it returns an empty string', () => {
    const datePipe = new DatePipe('en-GB');
    vi.spyOn(datePipe, 'transform').mockReturnValue(null);
    const adapter = createAngularTimeDisplayAdapter(datePipe, timeAdapter);

    expect(adapter.formatInstant(0)).toBe('');
  });

  it('Given an invalid instant, When formatting it, Then it raises a range error before invoking DatePipe', () => {
    const datePipe = new DatePipe('en-GB');
    const transform = vi.spyOn(datePipe, 'transform');
    const adapter = createAngularTimeDisplayAdapter(datePipe, timeAdapter);

    expect(() => adapter.formatInstant('invalid')).toThrow(RangeError);
    expect(transform).not.toHaveBeenCalled();
  });

  it.each([
    ['iso', 'PT1H30M'],
    ['digital', '01:30:00'],
    ['short', '1 hr, 30 min'],
    ['long', '1 hour, 30 minutes'],
  ] as const)(
    'Given style %s, When formatting a duration, Then it uses the requested representation',
    (style, expected) => {
      const adapter = createAngularTimeDisplayAdapter(
        new DatePipe('en-US'),
        timeAdapter,
      );

      expect(adapter.formatDuration(5_400_000, { style })).toBe(expected);
    },
  );

  it('Given a replacement locale, When formatting a duration, Then it uses that locale for localized styles', () => {
    const adapter = createAngularTimeDisplayAdapter(
      new DatePipe('en-US'),
      timeAdapter,
      'UTC',
      undefined,
      'es-ES',
    );

    expect(adapter.formatDuration(5_400_000, { style: 'long' })).toBe(
      '1 hora, 30 minutos',
    );
    expect(
      adapter.formatDuration(5_400_000, {
        style: 'short',
        locale: 'fr-FR',
      }),
    ).toBe('1 h, 30 min');
  });

  it('Given a negative or zero duration, When formatting it, Then it preserves the sign and zero value', () => {
    const adapter = createAngularTimeDisplayAdapter(
      new DatePipe('en-US'),
      timeAdapter,
    );

    expect(adapter.formatDuration(-5_400_000, { style: 'digital' })).toBe(
      '-01:30:00',
    );
    expect(adapter.formatDuration(0, { style: 'short' })).toBe('0 ms');
  });

  it('Given a locale source that changes, When formatting again, Then it uses the current locale', () => {
    const locale = { getLocale: vi.fn(() => 'en-US') };
    const adapter = createAngularTimeDisplayAdapter(
      new DatePipe('en-US'),
      timeAdapter,
      'UTC',
      undefined,
      locale,
    );

    expect(adapter.formatDuration(5_400_000, { style: 'long' })).toBe(
      '1 hour, 30 minutes',
    );
    locale.getLocale.mockReturnValue('es-ES');
    expect(adapter.formatDuration(5_400_000, { style: 'long' })).toBe(
      '1 hora, 30 minutos',
    );
  });

  it.each([
    [7_200_000, 'in 2 hours'],
    [-10_800_000, '3 hours ago'],
    [172_800_000, 'in 2 days'],
    [0, 'now'],
  ] as const)(
    'Given signed duration %s, When using relative style, Then it returns %s',
    (value, expected) => {
      const adapter = createAngularTimeDisplayAdapter(
        new DatePipe('en-US'),
        timeAdapter,
      );

      expect(adapter.formatDuration(value, { style: 'relative' })).toBe(
        expected,
      );
    },
  );

  it('Given a duration below an hour, When using relative style, Then it selects minutes or seconds', () => {
    const adapter = createAngularTimeDisplayAdapter(
      new DatePipe('en-US'),
      timeAdapter,
    );

    expect(adapter.formatDuration(30_000, { style: 'relative' })).toBe(
      'in 30 seconds',
    );
    expect(adapter.formatDuration(-120_000, { style: 'relative' })).toBe(
      '2 minutes ago',
    );
  });

  it('Given approximate calendar units, When formatting a long duration, Then it uses months and years with explicit approximations', () => {
    const adapter = createAngularTimeDisplayAdapter(
      new DatePipe('en-US'),
      timeAdapter,
    );

    expect(
      adapter.formatDuration(60 * 86_400_000, {
        style: 'relative',
        calendarUnits: 'approximate',
      }),
    ).toBe('in 2 months');
    expect(
      adapter.formatDuration(-730 * 86_400_000, {
        style: 'relative',
        calendarUnits: 'approximate',
      }),
    ).toBe('2 years ago');
  });
});
