import { DateTimeParts } from '../../core';
import { getFormatter } from './native-time-zone-formatter';

/** Reads calendar fields represented by a timestamp in an IANA time zone. */
export function getLocalParts(
  timestamp: number,
  timeZone: string,
): DateTimeParts {
  const parts = getFormatter(timeZone).formatToParts(new Date(timestamp));
  const values = new Map(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: Number(values.get('year')),
    month: Number(values.get('month')),
    day: Number(values.get('day')),
    hour: Number(values.get('hour')),
    minute: Number(values.get('minute')),
    second: Number(values.get('second')),
    millisecond: 0,
  };
}

/** Compares date-time fields without comparing their zone context. */
export function sameDateTime(
  left: DateTimeParts,
  right: DateTimeParts,
): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute &&
    left.second === right.second
  );
}
