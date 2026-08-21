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
});
