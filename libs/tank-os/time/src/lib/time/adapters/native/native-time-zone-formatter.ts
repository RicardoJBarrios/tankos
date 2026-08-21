const formatterCache = new Map<string, Intl.DateTimeFormat>();

/** Maximum number of zone formatters retained by the native adapter. */
export const FORMATTER_CACHE_LIMIT = 64;

/** Returns a cached formatter for an IANA time zone. */
export function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('en-US', {
    calendar: 'gregory',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  });
  formatterCache.set(timeZone, formatter);
  if (formatterCache.size > FORMATTER_CACHE_LIMIT) {
    const oldestTimeZone = formatterCache.keys().next().value;
    if (oldestTimeZone !== undefined) formatterCache.delete(oldestTimeZone);
  }
  return formatter;
}
