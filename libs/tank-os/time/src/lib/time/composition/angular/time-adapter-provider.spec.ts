import { TestBed } from '@angular/core/testing';
import { createNativeTimeAdapter } from '../../adapters/native';
import { TimeService } from '../../application';
import { provideTimeAdapter, provideTimeClock } from './time-adapter-provider';

describe('time-adapter-provider', () => {
  it('Given a replacement adapter, When configuring Angular, Then TimeService uses it', () => {
    const adapter = {
      ...createNativeTimeAdapter(),
      toUtcIsoString: () => 'provided-by-custom-adapter',
    };

    TestBed.configureTestingModule({
      providers: [provideTimeAdapter(adapter), provideTimeClock()],
    });

    expect(
      TestBed.inject(TimeService).toUtcIsoString('2026-08-20T14:30:00Z'),
    ).toBe('provided-by-custom-adapter');
  });

  it('Given a replacement clock, When reading now, Then TimeService delegates to it', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTimeAdapter(),
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
