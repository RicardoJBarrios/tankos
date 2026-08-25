import { createDataAccessError } from '../core';

/** Stable serialization for idempotency and request-size checks. */
export function stableJson(value: unknown): string {
  try {
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
    if (value && typeof value === 'object')
      return `{${Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
        .join(',')}}`;
    const serialized = JSON.stringify(value);
    if (serialized === undefined)
      throw new TypeError('Value cannot be serialized');
    return serialized;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Batch request'))
      throw error;
    throw createDataAccessError(
      'validation',
      'Batch request contains a value that cannot be serialized',
      error,
    );
  }
}
