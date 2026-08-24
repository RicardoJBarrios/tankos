import { TestBed } from '@angular/core/testing';
import {
  provideTankOsTime,
  provideTimeDisplayAdapter,
} from '../../composition';
import { HumanizeDurationPipe } from './humanize-duration.pipe';

describe('humanize-duration.pipe', () => {
  it.each([
    7_200_000,
    'PT2H',
    { kind: 'duration', milliseconds: 7_200_000 },
  ] as const)(
    'Given duration value %s, When humanizing it, Then it delegates to relative display',
    (value) => {
      const formatHumanizedDuration = vi.fn().mockReturnValue('in 2 hours');
      TestBed.configureTestingModule({
        providers: [
          provideTimeDisplayAdapter({
            formatInstant: () => 'instant',
            formatLocalDate: () => 'date',
            formatDuration: () => 'duration',
            formatHumanizedDuration,
          }),
        ],
      });
      const pipe = TestBed.runInInjectionContext(
        () => new HumanizeDurationPipe(),
      );

      expect(pipe.transform(value, { locale: 'en-US' })).toBe('in 2 hours');
      expect(formatHumanizedDuration).toHaveBeenCalledWith(value, {
        locale: 'en-US',
      });
    },
  );

  it('Given no duration, When humanizing it, Then it returns an empty string', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTimeDisplayAdapter({
          formatInstant: () => 'instant',
          formatLocalDate: () => 'date',
          formatDuration: () => 'relative',
          formatHumanizedDuration: () => 'relative',
        }),
      ],
    });
    const pipe = TestBed.runInInjectionContext(
      () => new HumanizeDurationPipe(),
    );

    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('Given approximate calendar units, When humanizing a long duration, Then it forwards the option', () => {
    const formatHumanizedDuration = vi.fn().mockReturnValue('in 2 months');
    TestBed.configureTestingModule({
      providers: [
        provideTimeDisplayAdapter({
          formatInstant: () => 'instant',
          formatLocalDate: () => 'date',
          formatDuration: () => 'duration',
          formatHumanizedDuration,
        }),
      ],
    });
    const pipe = TestBed.runInInjectionContext(
      () => new HumanizeDurationPipe(),
    );

    expect(
      pipe.transform(60 * 86_400_000, { calendarUnits: 'approximate' }),
    ).toBe('in 2 months');
    expect(formatHumanizedDuration).toHaveBeenCalledWith(60 * 86_400_000, {
      calendarUnits: 'approximate',
    });
  });

  it('Given the Angular composition, When humanizing with an explicit locale, Then it returns localized relative text', () => {
    TestBed.configureTestingModule({ providers: [provideTankOsTime()] });
    const pipe = TestBed.runInInjectionContext(
      () => new HumanizeDurationPipe(),
    );

    expect(pipe.transform(7_200_000, { locale: 'es-ES' })).toBe(
      'dentro de 2 horas',
    );
  });
});
