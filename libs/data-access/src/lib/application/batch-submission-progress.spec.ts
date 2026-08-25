import { describe, expect, it } from 'vitest';
import type { BatchOperationRecord } from '../core';
import { createEntityId } from '../core';
import { project } from './batch-submission-progress';

const now = { kind: 'instant' as const, epochMilliseconds: 0 };

function record(): BatchOperationRecord {
  return {
    batchId: createEntityId('batch-1'),
    principalId: createEntityId('keeper-1'),
    schema: 'units',
    operation: 'update',
    status: 'running',
    total: 2,
    processed: 1,
    warnings: 0,
    failures: 0,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
    selection: { fingerprint: 'request', total: 2, chunkCount: 1 },
    requestedSelection: { kind: 'filter', filter: { active: true } },
    requestFingerprint: 'request',
  };
}

describe('project', () => {
  it('Given a persisted batch, When projecting it, Then returns only public progress fields', () => {
    expect(project(record())).toEqual({
      batchId: createEntityId('batch-1'),
      schema: 'units',
      operation: 'update',
      status: 'running',
      total: 2,
      processed: 1,
      warnings: 0,
      failures: 0,
      createdAt: now,
      updatedAt: now,
      currentChunk: undefined,
      retryCount: 0,
      leaseOwner: undefined,
      leaseUntil: undefined,
    });
  });

  it('Given no persisted batch, When projecting it, Then raises not-found', () => {
    expect(() => project(undefined)).toThrow('Batch was not found');
  });
});
