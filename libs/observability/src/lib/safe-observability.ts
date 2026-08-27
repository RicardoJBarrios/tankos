const SENSITIVE_KEY =
  /api[-_]?key|authorization|cookie|credential|passwd|password|private[-_]?key|secret|token/iu;
const MAX_TEXT_LENGTH = 512;
const MAX_DEPTH = 4;
const MAX_ARRAY_ITEMS = 50;

/** Removes credentials and bounds diagnostic values before they leave the app. */
/* eslint-disable complexity -- this is the single untrusted-value type boundary. */
export function sanitizeObservabilityValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.slice(0, MAX_TEXT_LENGTH);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Error) return { name: value.name };
  if (depth >= MAX_DEPTH) return '[Truncated]';
  if (Array.isArray(value)) return sanitizeArray(value, depth);
  if (typeof value === 'object') {
    return sanitizeObject(value, depth);
  }
  return '[Unsupported]';
}
/* eslint-enable complexity */

function sanitizeArray(
  value: readonly unknown[],
  depth: number,
): readonly unknown[] {
  return value
    .slice(0, MAX_ARRAY_ITEMS)
    .map((item) => sanitizeObservabilityValue(item, depth + 1));
}

function sanitizeObject(value: object, depth: number): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value))
    result[key] = SENSITIVE_KEY.test(key)
      ? '[Redacted]'
      : sanitizeObservabilityValue(item, depth + 1);
  return result;
}
