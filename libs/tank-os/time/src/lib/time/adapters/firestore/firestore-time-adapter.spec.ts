import { Timestamp } from 'firebase/firestore';
import { createNativeTimeAdapter } from '../native';
import { createFirestoreTimeAdapter } from './firestore-time-adapter';

describe('firestore-time-adapter', () => {
  const adapter = createFirestoreTimeAdapter(createNativeTimeAdapter());

  it('Given an instant, When converting it to Firestore, Then it returns a Timestamp with the same UTC millisecond', () => {
    expect(adapter.toTimestamp('2026-08-20T15:30:01.250Z')).toEqual(
      Timestamp.fromMillis(Date.parse('2026-08-20T15:30:01.250Z')),
    );
  });

  it('Given a Firestore Timestamp, When converting it to an instant, Then it returns the normalized instant', () => {
    expect(
      adapter.fromTimestamp(
        Timestamp.fromMillis(Date.parse('2026-08-20T15:30:01.250Z')),
      ),
    ).toEqual({
      kind: 'instant',
      epochMilliseconds: Date.parse('2026-08-20T15:30:01.250Z'),
    });
  });

  it.each([
    '2026-08-20',
    { kind: 'local-date', year: 2026, month: 8, day: 20 } as const,
  ])(
    'Given a local date %s, When converting it to Firestore, Then it stores the canonical calendar string',
    (value) => {
      expect(adapter.toLocalDate(value)).toBe('2026-08-20');
    },
  );

  it('Given a Firestore local date string, When converting it, Then it returns a LocalDate', () => {
    expect(adapter.fromLocalDate('2026-08-20')).toEqual({
      kind: 'local-date',
      year: 2026,
      month: 8,
      day: 20,
    });
  });

  it.each([
    null,
    undefined,
    20260820,
    '2026-08-20 ',
    { kind: 'local-date', year: 2026, month: 8, day: 20 },
  ])(
    'Given an invalid Firestore local date %s, When converting it, Then it raises a range error',
    (value) => {
      expect(() => adapter.fromLocalDate(value)).toThrow(RangeError);
    },
  );

  it.each([null, undefined, {}, new Date(0)])(
    'Given an invalid Firestore timestamp %s, When converting it, Then it raises a range error',
    (value) => {
      expect(() => adapter.fromTimestamp(value)).toThrow(RangeError);
    },
  );
});
