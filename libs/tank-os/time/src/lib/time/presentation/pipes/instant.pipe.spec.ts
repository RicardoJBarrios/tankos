import { TestBed } from '@angular/core/testing';
import { provideTimeDisplayAdapter } from '../../composition';
import { InstantPipe } from './instant.pipe';

describe('instant.pipe', () => {
  const adapter = {
    formatInstant: () => '20 Aug 2026',
    formatLocalDate: () => '20 August 2026',
    formatDuration: () => '1 hr',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTimeDisplayAdapter(adapter)],
    });
  });

  it.each([
    '2026-08-20T15:30:00Z',
    0,
    { kind: 'instant', epochMilliseconds: 0 },
  ] as const)(
    'Given supported instant value %s, When transforming it, Then it delegates to temporal display',
    (value) => {
      const pipe = TestBed.runInInjectionContext(() => new InstantPipe());

      expect(pipe.transform(value)).toBe('20 Aug 2026');
    },
  );

  it('Given no instant, When transforming it, Then it returns an empty string', () => {
    const pipe = TestBed.runInInjectionContext(() => new InstantPipe());

    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('Given DatePipe-compatible arguments, When transforming an instant, Then it forwards them to the display service', () => {
    const formatInstant = vi.fn().mockReturnValue('formatted');
    TestBed.configureTestingModule({
      providers: [
        provideTimeDisplayAdapter({
          formatInstant,
          formatLocalDate: () => 'date',
          formatDuration: () => '1 hr',
        }),
      ],
    });
    const pipe = TestBed.runInInjectionContext(() => new InstantPipe());

    expect(
      pipe.transform(0, 'full', 'Atlantic/Canary', 'es-ES', {
        format: 'medium',
      }),
    ).toBe('formatted');
    expect(formatInstant).toHaveBeenCalledWith(0, {
      format: 'full',
      timeZone: 'Atlantic/Canary',
      locale: 'es-ES',
    });
  });
});
