import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import {
  provideAngularTimeDisplayAdapter,
  provideTimeDisplayAdapter,
  provideTimeDisplayContext,
  provideTimeLocale,
} from './time-display-provider';
import { provideTimePort, provideTimeClock } from './time-port-provider';
import { TimeDisplayService } from '../../application';
import { vi } from 'vitest';

describe('time-display-provider', () => {
  it('Given an Angular locale, When configuring the default display provider, Then DatePipe formats with that locale', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTimePort(),
        provideTimeClock(),
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

  it('Given a replacement locale source, When configuring the display provider, Then DatePipe uses that locale instead of Angular LOCALE_ID', () => {
    const locale = { getLocale: vi.fn(() => 'en-US') };

    TestBed.configureTestingModule({
      providers: [
        provideTimePort(),
        provideTimeClock(),
        provideTimeLocale(locale),
        provideAngularTimeDisplayAdapter('UTC'),
        { provide: LOCALE_ID, useValue: 'fr-FR' },
      ],
    });

    expect(
      TestBed.inject(TimeDisplayService).formatInstant(0, {
        format: 'longDate',
        timeZone: 'UTC',
      }),
    ).toBe('January 1, 1970');
    expect(locale.getLocale).toHaveBeenCalledOnce();
  });

  it('Given a replacement display adapter, When configuring Angular, Then the display service uses it', () => {
    const adapter = {
      formatInstant: () => 'custom instant',
      formatLocalDate: () => 'custom date',
    };

    TestBed.configureTestingModule({
      providers: [
        provideTimePort(),
        provideTimeClock(),
        provideTimeDisplayAdapter(adapter),
      ],
    });

    expect(
      TestBed.inject(TimeDisplayService).formatInstant('2026-08-20T15:30:00Z'),
    ).toBe('custom instant');
  });

  it('Given the Angular display provider, When configuring Angular, Then the service uses DatePipe-backed formatting', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTimePort(),
        provideTimeClock(),
        provideAngularTimeDisplayAdapter('UTC'),
      ],
    });

    expect(
      TestBed.inject(TimeDisplayService).formatInstant(0, {
        format: 'short',
        timeZone: 'UTC',
      }),
    ).toContain('1/1/70');
  });

  it('Given an aquarium display zone, When no pipe zone is provided, Then the aquarium zone wins over the user zone', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTimePort(),
        provideTimeClock(),
        provideTimeDisplayContext({
          aquariumTimeZone: 'Europe/Madrid',
          userTimeZone: 'Pacific/Honolulu',
        }),
        provideAngularTimeDisplayAdapter(),
      ],
    });

    expect(
      TestBed.inject(TimeDisplayService).formatInstant('2026-08-20T22:30:00Z', {
        format: 'yyyy-MM-dd HH:mm',
      }),
    ).toBe('2026-08-21 00:30');
  });

  it('Given only a user display zone, When no pipe zone is provided, Then the user zone is used', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTimePort(),
        provideTimeClock(),
        provideTimeDisplayContext({ userTimeZone: 'Pacific/Honolulu' }),
        provideAngularTimeDisplayAdapter(),
      ],
    });

    expect(
      TestBed.inject(TimeDisplayService).formatInstant('2026-08-20T22:30:00Z', {
        format: 'yyyy-MM-dd HH:mm',
      }),
    ).toBe('2026-08-20 12:30');
  });
});
