import { describe, expect, it } from 'vitest';
import { createMaterializationCancelledPatch } from './batch-submission-cancelled-patch';

describe('createMaterializationCancelledPatch', () => {
  it('Given an update timestamp, When creating a cancellation patch, Then cancels and clears the lease', () => {
    const now = { kind: 'instant' as const, epochMilliseconds: 0 };
    expect(createMaterializationCancelledPatch(now)).toEqual({
      status: 'cancelled',
      updatedAt: now,
      materializationLeaseOwner: null,
      materializationLeaseToken: null,
      materializationLeaseUntil: null,
    });
  });
});
