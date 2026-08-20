import { TestBed } from '@angular/core/testing';
import { provideTimeDisplayAdapter } from '../../application';
import { LocalDatePipe } from './local-date.pipe';

describe('local-date.pipe', () => {
  const adapter = {
    formatInstant: () => '20 Aug 2026',
    formatLocalDate: () => '20 August 2026',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTimeDisplayAdapter(adapter)],
    });
  });

  it.each([
    '2026-08-20',
    { kind: 'local-date', year: 2026, month: 8, day: 20 },
    '',
  ] as const)(
    'Given supported local date value %s, When transforming it, Then it delegates to temporal display',
    (value) => {
      const pipe = TestBed.runInInjectionContext(() => new LocalDatePipe());

      expect(pipe.transform(value)).toBe('20 August 2026');
    },
  );

  it('Given no local date, When transforming it, Then it returns an empty string', () => {
    const pipe = TestBed.runInInjectionContext(() => new LocalDatePipe());

    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('Given DatePipe-compatible arguments, When transforming a local date, Then it forwards them to the display service', () => {
    const formatLocalDate = vi.fn().mockReturnValue('formatted');
    TestBed.configureTestingModule({
      providers: [
        provideTimeDisplayAdapter({
          formatInstant: () => 'instant',
          formatLocalDate,
        }),
      ],
    });
    const pipe = TestBed.runInInjectionContext(() => new LocalDatePipe());

    expect(
      pipe.transform('2026-08-20', 'fullDate', 'Atlantic/Canary', 'es-ES', {
        format: 'longDate',
      }),
    ).toBe('formatted');
    expect(formatLocalDate).toHaveBeenCalledWith('2026-08-20', {
      format: 'fullDate',
      timeZone: 'Atlantic/Canary',
      locale: 'es-ES',
    });
  });
});
