import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-time-adapter', () => {
  it('Given the native runtime, When creating an adapter, Then every composed temporal port operation is available', () => {
    const adapter = createNativeTimeAdapter();

    expect(adapter).toEqual(
      expect.objectContaining({
        parseInstant: expect.any(Function),
        isValidInstant: expect.any(Function),
        toUtcIsoString: expect.any(Function),
        parseDuration: expect.any(Function),
        isValidDuration: expect.any(Function),
        toDurationIsoString: expect.any(Function),
        durationBetween: expect.any(Function),
        addDuration: expect.any(Function),
        compareInstants: expect.any(Function),
        compareDurations: expect.any(Function),
        createInterval: expect.any(Function),
        contains: expect.any(Function),
        clamp: expect.any(Function),
        addLocalDate: expect.any(Function),
        durationBetweenLocalDates: expect.any(Function),
        parseLocalDate: expect.any(Function),
        isValidLocalDate: expect.any(Function),
        fromZonedDateTime: expect.any(Function),
        resolveZonedDateTime: expect.any(Function),
        resolveOffsetDateTime: expect.any(Function),
        isValidTimeZone: expect.any(Function),
      }),
    );
  });

  it('Given a replacement time-zone database, When resolving a zone, Then the native adapter delegates the complete resolution to it', () => {
    const instant = { kind: 'instant' as const, epochMilliseconds: 1234 };
    const database = {
      isValid: vi.fn().mockReturnValue(true),
      resolveLocalDateTime: vi.fn().mockReturnValue(instant),
      getOffsetMinutes: vi.fn().mockReturnValue(60),
    };
    const adapter = createNativeTimeAdapter(database);

    expect(adapter.fromZonedDateTime('local', 'Custom/Zone')).toEqual(instant);
    expect(database.resolveLocalDateTime).toHaveBeenCalledWith(
      'local',
      'Custom/Zone',
    );
  });
});
