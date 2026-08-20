import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import {
  provideAngularTimeDisplayAdapter,
  provideTimeDisplayAdapter,
} from './time-display-provider';
import { TimeDisplayService } from './time-display-service';

describe('time-display-provider', () => {
  it('Given an Angular locale, When configuring the default display provider, Then DatePipe formats with that locale', () => {
    TestBed.configureTestingModule({
      providers: [
        provideAngularTimeDisplayAdapter('UTC'),
        { provide: LOCALE_ID, useValue: 'en-US' },
      ],
    });

    expect(
      TestBed.inject(TimeDisplayService).formatInstant(0, {
        format: 'shortDate',
        timeZone: 'UTC',
      }),
    ).toBe('1/1/70');
  });

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
