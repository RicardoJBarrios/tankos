import { describe, expect, it } from 'vitest';
import { createQueuedPatch } from './batch-submission-queued-patch';

describe('createQueuedPatch', () => {
  it('Given a materialized selection, When creating its patch, Then queues it and clears the lease', () => {
    const now = { kind: 'instant' as const, epochMilliseconds: 0 };
    expect(createQueuedPatch('request', 3, 2, now)).toMatchObject({
      status: 'queued',
      total: 3,
      selection: { fingerprint: 'request', chunkCount: 2 },
      updatedAt: now,
      materializationLeaseOwner: null,
      materializationLeaseToken: null,
      materializationLeaseUntil: null,
    });
  });
});
