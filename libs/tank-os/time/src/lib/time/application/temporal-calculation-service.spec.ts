import { TestBed } from '@angular/core/testing';
import { provideTankOsTime } from '../composition';
import { TemporalCalculationService } from './temporal-calculation-service';

describe('temporal-calculation-service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTankOsTime()] });
  });

  it('Given two instants, When calculating duration through Angular, Then it returns elapsed milliseconds', () => {
    expect(
      TestBed.inject(TemporalCalculationService).durationBetween(0, 1_000),
    ).toEqual({ kind: 'duration', milliseconds: 1_000 });
  });

  it('Given an instant and duration, When adding through Angular, Then it returns the shifted instant', () => {
    expect(
      TestBed.inject(TemporalCalculationService).addDuration(0, 1_000),
    ).toEqual({ kind: 'instant', epochMilliseconds: 1_000 });
  });

  it('Given two instants and durations, When comparing through Angular, Then it returns their ordering', () => {
    const service = TestBed.inject(TemporalCalculationService);

    expect(service.compareInstants(0, 1)).toBe(-1);
    expect(service.compareDurations('PT1S', 1_000)).toBe(0);
  });

  it('Given interval boundaries, When creating and querying through Angular, Then it supports containment and clamping', () => {
    const service = TestBed.inject(TemporalCalculationService);
    const interval = service.createInterval(0, 1_000);

    expect(service.contains(interval, 500)).toBe(true);
    expect(service.clamp(2_000, interval)).toEqual({
      kind: 'instant',
      epochMilliseconds: 1_000,
    });
  });

  it('Given a local date and calendar period, When adding through Angular, Then it preserves calendar semantics', () => {
    expect(
      TestBed.inject(TemporalCalculationService).addLocalDate('2024-01-31', {
        months: 1,
      }),
    ).toEqual({ kind: 'local-date', year: 2024, month: 2, day: 29 });
  });

  it('Given two local dates, When calculating their calendar duration through Angular, Then it returns whole days', () => {
    expect(
      TestBed.inject(TemporalCalculationService).durationBetweenLocalDates(
        '2026-08-20',
        '2026-08-23',
      ),
    ).toEqual({ kind: 'duration', milliseconds: 259_200_000 });
  });
});
