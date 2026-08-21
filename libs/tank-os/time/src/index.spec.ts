import * as publicApi from './index';
import * as adapters from './lib/time/adapters';

describe('main entry point', () => {
  it('Given the main entry point, When importing it, Then it exposes the native runtime factories', () => {
    expect(publicApi.createNativeClock).toEqual(expect.any(Function));
    expect(publicApi.createNativeTimeAdapter).toEqual(expect.any(Function));
    expect(publicApi.createNativeTimeZoneDatabase).toEqual(
      expect.any(Function),
    );
  });

  it('Given the main entry point, When importing it, Then it exposes the duration runtime helpers', () => {
    expect(publicApi.nativeIsValidDuration).toEqual(expect.any(Function));
    expect(publicApi.nativeParseDuration).toEqual(expect.any(Function));
    expect(publicApi.nativeToDurationIsoString).toEqual(expect.any(Function));
  });

  it('Given the main entry point, When importing it, Then it exposes the Angular application and composition API', () => {
    expect(publicApi.TimeService).toEqual(expect.any(Function));
    expect(publicApi.TimeDisplayService).toEqual(expect.any(Function));
    expect(publicApi.provideTimePort).toEqual(expect.any(Function));
    expect(publicApi.provideTankOsTime).toEqual(expect.any(Function));
    expect(publicApi.TIME_PORT).toBeDefined();
  });

  it('Given the main entry point, When importing it, Then it exposes the presentation API', () => {
    expect(publicApi.InstantPipe).toEqual(expect.any(Function));
    expect(publicApi.LocalDatePipe).toEqual(expect.any(Function));
    expect(publicApi.DurationPipe).toEqual(expect.any(Function));
    expect(publicApi.createAngularTimeDisplayAdapter).toEqual(
      expect.any(Function),
    );
    expect(publicApi.createAngularTimeLocaleAdapter).toEqual(
      expect.any(Function),
    );
  });

  it('Given the adapter barrel, When importing it, Then it exposes the adapter families', () => {
    expect(adapters.createNativeTimeAdapter).toEqual(expect.any(Function));
    expect(adapters.createAngularTimeDisplayAdapter).toEqual(
      expect.any(Function),
    );
  });
});
