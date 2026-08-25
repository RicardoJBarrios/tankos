import type { ClockPort } from '@tankos/time';

/** Patch used to resume an interrupted batch. */
export function createResumePatch(updatedAt: ReturnType<ClockPort['now']>) {
  return { status: 'queued' as const, updatedAt };
}
