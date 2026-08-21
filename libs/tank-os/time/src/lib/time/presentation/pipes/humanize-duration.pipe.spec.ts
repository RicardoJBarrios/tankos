import { TestBed } from '@angular/core/testing';
import { provideTimeDisplayAdapter } from '../../composition';
import { HumanizeDurationPipe } from './humanize-duration.pipe';

describe('humanize-duration.pipe', () => {
  it.each([
    7_200_000,
    'PT2H',
    { kind: 'duration', milliseconds: 7_200_000 },
  ] as const)(
    'Given duration value %s, When humanizing it, Then it delegates to relative display',
    (value) => {
      const formatDuration = vi.fn().mockReturnValue('in 2 hours');
      TestBed.configureTestingModule({
        providers: [
          provideTimeDisplayAdapter({
            formatInstant: () => 'instant',
            formatLocalDate: () => 'date',
            formatDuration,
          }),
        ],
      });
      const pipe = TestBed.runInInjectionContext(
        () => new HumanizeDurationPipe(),
      );

      expect(pipe.transform(value, { locale: 'en-US' })).toBe('in 2 hours');
      expect(formatDuration).toHaveBeenCalledWith(value, {
        style: 'relative',
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
    const formatDuration = vi.fn().mockReturnValue('in 2 months');
    TestBed.configureTestingModule({
      providers: [
        provideTimeDisplayAdapter({
          formatInstant: () => 'instant',
          formatLocalDate: () => 'date',
          formatDuration,
        }),
      ],
    });
    const pipe = TestBed.runInInjectionContext(
      () => new HumanizeDurationPipe(),
    );

    expect(
      pipe.transform(60 * 86_400_000, { calendarUnits: 'approximate' }),
    ).toBe('in 2 months');
    expect(formatDuration).toHaveBeenCalledWith(60 * 86_400_000, {
      style: 'relative',
      calendarUnits: 'approximate',
    });
  });
});
