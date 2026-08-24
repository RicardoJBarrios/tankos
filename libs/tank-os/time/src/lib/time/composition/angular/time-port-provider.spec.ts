import { TestBed } from '@angular/core/testing';
import { createNativeTimeAdapter } from '../../adapters/native';
import { TimeService } from '../../application';
import { provideTimePort, provideTimeClock } from './time-port-provider';

describe('time-port-provider', () => {
  it('Given a replacement temporal port, When configuring Angular, Then TimeService uses it', () => {
    const timePort = {
      ...createNativeTimeAdapter(),
      toUtcIsoString: () => 'provided-by-custom-port',
    };

    TestBed.configureTestingModule({
      providers: [provideTimePort(timePort), provideTimeClock()],
    });

    expect(
      TestBed.inject(TimeService).toUtcIsoString('2026-08-20T14:30:00Z'),
    ).toBe('provided-by-custom-port');
  });

  it('Given a replacement clock, When reading now, Then TimeService delegates to it', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTimePort(),
        provideTimeClock({
          now: () => ({ kind: 'instant', epochMilliseconds: 1234 }),
        }),
      ],
    });

    expect(TestBed.inject(TimeService).now()).toEqual({
      kind: 'instant',
      epochMilliseconds: 1234,
    });
  });
});
