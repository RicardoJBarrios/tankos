import { systemClock } from '../application/clock';

export function currentDateTimeLocal(now = systemClock.now()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
