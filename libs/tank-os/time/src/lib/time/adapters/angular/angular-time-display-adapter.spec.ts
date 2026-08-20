import { DatePipe } from '@angular/common';
import { createAngularTimeDisplayAdapter } from './angular-time-display-adapter';

describe('angular-time-display-adapter', () => {
  it('Given an instant, When formatting it, Then it delegates the epoch, format and UTC zone to DatePipe', () => {
    const datePipe = new DatePipe('en-GB');
    const transform = vi
      .spyOn(datePipe, 'transform')
      .mockReturnValue('formatted');
    const adapter = createAngularTimeDisplayAdapter(datePipe);

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

  it('Given an aquarium IANA timezone, When formatting an instant, Then it resolves the offset at that instant before delegating', () => {
    const datePipe = new DatePipe('en-GB');
    const transform = vi
      .spyOn(datePipe, 'transform')
      .mockReturnValue('formatted');
    const adapter = createAngularTimeDisplayAdapter(datePipe);

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
      'Atlantic/Canary',
    );

    adapter.formatInstant(0, { format: 'short' });

    expect(transform).toHaveBeenCalledWith(0, 'short', '+0000', undefined);
  });

  it('Given a local date, When formatting it, Then it always delegates with UTC to preserve the calendar day', () => {
    const datePipe = new DatePipe('en-GB');
    const transform = vi.spyOn(datePipe, 'transform').mockReturnValue('date');
    const adapter = createAngularTimeDisplayAdapter(datePipe);

    expect(
      adapter.formatLocalDate('2026-08-20', {
        format: 'fullDate',
        timeZone: 'Europe/Madrid',
      }),
    ).toBe('date');
    expect(transform).toHaveBeenCalledWith(
      Date.UTC(2026, 7, 20),
      'fullDate',
      '+0000',
      undefined,
    );
  });

  it('Given an invalid instant, When formatting it, Then it raises a range error before invoking DatePipe', () => {
    const datePipe = new DatePipe('en-GB');
    const transform = vi.spyOn(datePipe, 'transform');
    const adapter = createAngularTimeDisplayAdapter(datePipe);

    expect(() => adapter.formatInstant('invalid')).toThrow(RangeError);
    expect(transform).not.toHaveBeenCalled();
  });
});
