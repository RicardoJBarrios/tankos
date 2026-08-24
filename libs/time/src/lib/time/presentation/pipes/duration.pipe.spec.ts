import { TestBed } from '@angular/core/testing';
import { provideTimeDisplayAdapter } from '../../composition';
import { DurationPipe } from './duration.pipe';

describe('duration.pipe', () => {
  const adapter = {
    formatInstant: () => '20 Aug 2026',
    formatLocalDate: () => '20 August 2026',
    formatDuration: () => '1 hr, 30 min',
    formatHumanizedDuration: () => 'in 2 hours',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTimeDisplayAdapter(adapter)],
    });
  });

  it.each([
    'PT1H30M',
    5_400_000,
    { kind: 'duration', milliseconds: 5_400_000 },
  ] as const)(
    'Given supported duration value %s, When transforming it, Then it delegates to temporal display',
    (value) => {
      const pipe = TestBed.runInInjectionContext(() => new DurationPipe());

      expect(pipe.transform(value)).toBe('1 hr, 30 min');
    },
  );

  it('Given no duration, When transforming it, Then it returns an empty string', () => {
    const pipe = TestBed.runInInjectionContext(() => new DurationPipe());

    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('Given duration display options, When transforming a duration, Then it forwards style and locale', () => {
    const formatDuration = vi.fn().mockReturnValue('PT1H30M');
    TestBed.configureTestingModule({
      providers: [
        provideTimeDisplayAdapter({
          formatInstant: () => 'instant',
          formatLocalDate: () => 'date',
          formatDuration,
          formatHumanizedDuration: () => 'relative',
        }),
      ],
    });
    const pipe = TestBed.runInInjectionContext(() => new DurationPipe());

    expect(pipe.transform(5_400_000, 'iso', 'es-ES')).toBe('PT1H30M');
    expect(formatDuration).toHaveBeenCalledWith(5_400_000, {
      style: 'iso',
      locale: 'es-ES',
    });
  });
});
