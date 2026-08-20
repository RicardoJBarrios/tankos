import { TestBed } from '@angular/core/testing';
import { createNativeTimeAdapter } from '../adapters/native/native-time-adapter';
import { provideTimeAdapter } from './time-provider';
import { TimeService } from './time-service';

describe('time-provider', () => {
  it('Given a replacement adapter, When configuring Angular, Then TimeService uses it', () => {
    const adapter = {
      ...createNativeTimeAdapter(),
      toUtcIsoString: () => 'provided-by-custom-adapter',
    };

    TestBed.configureTestingModule({
      providers: [provideTimeAdapter(adapter)],
    });

    expect(
      TestBed.inject(TimeService).toUtcIsoString('2026-08-20T14:30:00Z'),
    ).toBe('provided-by-custom-adapter');
  });
});
