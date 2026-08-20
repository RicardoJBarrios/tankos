import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-time-adapter', () => {
  it('Given the native runtime, When creating an adapter, Then every TimeAdapter operation is available', () => {
    const adapter = createNativeTimeAdapter();

    expect(adapter).toEqual(
      expect.objectContaining({
        parseInstant: expect.any(Function),
        isValidInstant: expect.any(Function),
        toUtcIsoString: expect.any(Function),
        parseLocalDate: expect.any(Function),
        isValidLocalDate: expect.any(Function),
        fromZonedDateTime: expect.any(Function),
        isValidTimeZone: expect.any(Function),
      }),
    );
  });
});
