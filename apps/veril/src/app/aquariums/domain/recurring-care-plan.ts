import { AquariumId, AquariumTimeZone, aquariumTimeZoneFrom } from './aquarium';
import { PlannedCareWorkId } from './planned-care-work';
import { isUuidV4 } from './uuid-v4';

export type RecurringCarePlanId = string & {
  readonly __recurringCarePlanId: unique symbol;
};

export function createRecurringCarePlanId(): RecurringCarePlanId {
  return crypto.randomUUID() as RecurringCarePlanId;
}

export function recurringCarePlanIdFrom(value: string): RecurringCarePlanId {
  if (!isUuidV4(value)) {
    throw new Error('RecurringCarePlanId must be a UUID v4');
  }

  return value as RecurringCarePlanId;
}

export interface RecurringCarePlan {
  readonly id: RecurringCarePlanId;
  readonly aquariumId: AquariumId;
  readonly description: string;
  readonly firstOccurrenceAt: Date;
  readonly recordedAt: Date;
  readonly outstandingPlannedCareWorkId: PlannedCareWorkId;
}

export function createRecurringCarePlan(input: {
  readonly id: RecurringCarePlanId;
  readonly aquariumId: AquariumId;
  readonly description: string;
  readonly firstOccurrenceAt: Date;
  readonly recordedAt: Date;
  readonly outstandingPlannedCareWorkId: PlannedCareWorkId;
  readonly timeZone: AquariumTimeZone;
}): RecurringCarePlan {
  const description = input.description.trim();
  if (!description) {
    throw new Error('Recurring Care description must not be empty');
  }
  if (Number.isNaN(input.firstOccurrenceAt.getTime())) {
    throw new Error('Recurring Care first occurrence must be a valid date');
  }
  if (Number.isNaN(input.recordedAt.getTime())) {
    throw new Error('Recurring Care recordedAt must be a valid date');
  }

  aquariumTimeZoneFrom(input.timeZone);

  return {
    id: input.id,
    aquariumId: input.aquariumId,
    description,
    firstOccurrenceAt: input.firstOccurrenceAt,
    recordedAt: input.recordedAt,
    outstandingPlannedCareWorkId: input.outstandingPlannedCareWorkId,
  };
}

type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function localParts(value: Date, timeZone: AquariumTimeZone): LocalParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(value)
    .reduce<Record<string, string>>((result, part) => {
      if (part.type !== 'literal') result[part.type] = part.value;
      return result;
    }, {});

  return {
    year: Number(parts['year']),
    month: Number(parts['month']),
    day: Number(parts['day']),
    hour: Number(parts['hour']),
    minute: Number(parts['minute']),
  };
}

function timeZoneOffsetMinutes(
  value: Date,
  timeZone: AquariumTimeZone,
): number {
  const parts = localParts(value, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  return (asUtc - value.getTime()) / 60_000;
}

function sameLocalParts(left: LocalParts, right: LocalParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  );
}

function resolveLocalParts(
  target: LocalParts,
  timeZone: AquariumTimeZone,
): Date {
  const localAsUtc = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
  );
  const offsets = new Set<number>();
  for (const hours of [-48, -24, -6, 0, 6, 24, 48]) {
    offsets.add(
      timeZoneOffsetMinutes(new Date(localAsUtc + hours * 3_600_000), timeZone),
    );
  }

  const candidates = [...offsets]
    .map((offset) => new Date(localAsUtc - offset * 60_000))
    .filter((candidate) =>
      sameLocalParts(localParts(candidate, timeZone), target),
    )
    .sort((left, right) => left.getTime() - right.getTime());

  if (candidates[0]) return candidates[0];

  for (let minute = 1; minute <= 1_440; minute += 1) {
    const shifted = new Date(localAsUtc + minute * 60_000);
    const shiftedParts = {
      ...target,
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour: shifted.getUTCHours(),
      minute: shifted.getUTCMinutes(),
    };
    const resolved = resolveLocalParts(shiftedParts, timeZone);
    if (resolved) return resolved;
  }

  throw new Error('Could not resolve local recurrence time');
}

export function resolveLocalDateTime(
  value: string,
  timeZone: AquariumTimeZone,
): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match)
    throw new Error('Recurring Care date/time must use HH:mm precision');
  const target = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
  if (
    target.month < 1 ||
    target.month > 12 ||
    target.day < 1 ||
    target.day > 31 ||
    target.hour > 23 ||
    target.minute > 59
  ) {
    throw new Error('Recurring Care date/time is invalid');
  }
  return resolveLocalParts(target, timeZone);
}

function addDays(value: LocalParts, days: number): LocalParts {
  const date = new Date(Date.UTC(value.year, value.month - 1, value.day));
  date.setUTCDate(date.getUTCDate() + days);
  return {
    ...value,
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function nextWeeklyOccurrence(
  anchor: Date,
  after: Date,
  timeZone: AquariumTimeZone,
): Date {
  if (Number.isNaN(anchor.getTime()) || Number.isNaN(after.getTime())) {
    throw new Error('Weekly recurrence dates must be valid');
  }

  const anchorLocal = localParts(anchor, timeZone);
  const anchorDate = new Date(
    Date.UTC(anchorLocal.year, anchorLocal.month - 1, anchorLocal.day),
  );
  const afterLocal = localParts(after, timeZone);
  const afterDate = new Date(
    Date.UTC(afterLocal.year, afterLocal.month - 1, afterLocal.day),
  );
  const approximateWeeks = Math.max(
    0,
    Math.floor((afterDate.getTime() - anchorDate.getTime()) / (7 * 86_400_000)),
  );

  let candidateLocal = addDays(anchorLocal, approximateWeeks * 7);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = resolveLocalParts(candidateLocal, timeZone);
    if (candidate.getTime() > after.getTime()) return candidate;
    candidateLocal = addDays(candidateLocal, 7);
  }

  throw new Error('Could not calculate next weekly occurrence');
}
