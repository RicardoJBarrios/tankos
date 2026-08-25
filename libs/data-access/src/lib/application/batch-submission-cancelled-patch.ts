import type { ClockPort } from '@tankos/time';

/** Patch used to persist cancellation during materialization. */
export function createMaterializationCancelledPatch(
  updatedAt: ReturnType<ClockPort['now']>,
) {
  return {
    status: 'cancelled' as const,
    updatedAt,
    materializationLeaseOwner: null,
    materializationLeaseToken: null,
    materializationLeaseUntil: null,
  };
}
