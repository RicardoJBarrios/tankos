import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideTimeDisplayAdapter } from './time-display-provider';
import { TimeDisplayAdapter } from '../../core';
import { TimeDisplayService } from '../../application';

describe('time-display-adapter contract', () => {
  it('Given a custom display adapter, When the display service is used, Then every presentation capability is available', () => {
    const adapter: TimeDisplayAdapter = {
      formatInstant: vi.fn().mockReturnValue('instant'),
      formatLocalDate: vi.fn().mockReturnValue('local date'),
      formatDuration: vi.fn().mockReturnValue('duration'),
      formatHumanizedDuration: vi.fn().mockReturnValue('relative duration'),
    };
    TestBed.configureTestingModule({
      providers: [provideTimeDisplayAdapter(adapter)],
    });
    const service = TestBed.inject(TimeDisplayService);

    expect(service.formatInstant(0)).toBe('instant');
    expect(service.formatLocalDate('2026-08-20')).toBe('local date');
    expect(service.formatDuration(1_000)).toBe('duration');
    expect(service.formatHumanizedDuration(1_000)).toBe('relative duration');
    expect(adapter.formatHumanizedDuration).toHaveBeenCalledWith(
      1_000,
      undefined,
    );
  });
});
