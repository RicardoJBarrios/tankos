import type { ClockPort } from '@tankos/time';

/** Patch used after a selection has been materialized. */
export function createQueuedPatch(
  requestFingerprint: string,
  total: number,
  chunkSize: number,
  updatedAt: ReturnType<ClockPort['now']>,
) {
  return {
    status: 'queued' as const,
    total,
    selection: {
      fingerprint: requestFingerprint,
      total,
      chunkCount: Math.ceil(total / chunkSize),
    },
    updatedAt,
    materializationLeaseOwner: null,
    materializationLeaseToken: null,
    materializationLeaseUntil: null,
  };
}
