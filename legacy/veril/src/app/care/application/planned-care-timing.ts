export type PlannedCareTiming = 'overdue' | 'upcoming';

export function classifyPlannedCareTiming(
  plannedFor: Date,
  now: Date,
): PlannedCareTiming {
  return plannedFor.getTime() < now.getTime() ? 'overdue' : 'upcoming';
}
