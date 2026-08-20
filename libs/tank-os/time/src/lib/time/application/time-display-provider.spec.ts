import { TestBed } from '@angular/core/testing';
import {
  provideAngularTimeDisplayAdapter,
  provideTimeDisplayAdapter,
} from './time-display-provider';
import { TimeDisplayService } from './time-display-service';

describe('time-display-provider', () => {
  it('Given a replacement display adapter, When configuring Angular, Then the display service uses it', () => {
    const adapter = {
      formatInstant: () => 'custom instant',
      formatLocalDate: () => 'custom date',
    };

    TestBed.configureTestingModule({
      providers: [provideTimeDisplayAdapter(adapter)],
    });

    expect(
      TestBed.inject(TimeDisplayService).formatInstant('2026-08-20T15:30:00Z'),
    ).toBe('custom instant');
  });

  it('Given the Angular display provider, When configuring Angular, Then the service uses DatePipe-backed formatting', () => {
    TestBed.configureTestingModule({
      providers: [provideAngularTimeDisplayAdapter('UTC')],
    });

    expect(
      TestBed.inject(TimeDisplayService).formatInstant(0, {
        format: 'short',
        timeZone: 'UTC',
      }),
    ).toContain('1/1/70');
  });
});
