/**
 * Truncates a finite epoch or elapsed millisecond value toward zero.
 *
 * @param value - Numeric value that may contain sub-millisecond precision.
 * @returns The safe integer millisecond representation.
 * @throws `RangeError` when the value cannot be represented safely.
 */
export function truncateMilliseconds(value: number): number {
  const milliseconds = Math.trunc(value);
  if (!Number.isFinite(value) || !Number.isSafeInteger(milliseconds)) {
    throw new RangeError('Value exceeds safe millisecond precision');
  }
  return milliseconds === 0 ? 0 : milliseconds;
}

/**
 * Converts Firestore seconds and nanoseconds to the canonical millisecond
 * representation using mathematical truncation toward zero.
 *
 * @param seconds - Timestamp seconds from the Unix epoch.
 * @param nanoseconds - Timestamp nanoseconds within the second.
 * @returns A safe integer epoch millisecond value.
 * @throws `RangeError` when the timestamp cannot be represented safely.
 */
export function truncateTimestampMilliseconds(
  seconds: number,
  nanoseconds: number,
): number {
  return truncateMilliseconds(
    seconds * MILLISECONDS_PER_SECOND +
      nanoseconds / NANOSECONDS_PER_MILLISECOND,
  );
}
const NANOSECONDS_PER_MILLISECOND = 1_000_000;
const MILLISECONDS_PER_SECOND = 1_000;
