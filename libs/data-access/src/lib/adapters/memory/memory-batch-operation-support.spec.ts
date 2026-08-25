import { describe, expect, it } from 'vitest';
import {
  batchError,
  createInitialOperation,
  executeMemoryBatch,
  executeWithConcurrency,
  failedItem,
  fingerprint,
  initialProgress,
  publicProgress,
  requestFingerprint,
  terminalStatus,
  updateProgress,
} from './memory-batch-operation-support';
import { createEntityId } from '../../core';
import type { BatchRequest, TechnicalTimestamp } from '../../core';

const now: TechnicalTimestamp = { kind: 'instant', epochMilliseconds: 1_000 };
const request: BatchRequest<{ active: boolean }, { owner: string }> = {
  access: { principalId: createEntityId('keeper-1'), roles: ['keeper'] },
  schema: 'units',
  operation: 'update',
  selection: { kind: 'filter', filter: { owner: 'keeper-1' } },
  confirmationToken: 'confirmed',
  idempotencyKey: 'request-1',
  payload: { active: true },
};

describe('memory-batch-operation-support', () => {
  it('Given an Error, When failedItem normalizes it, Then it preserves name and message', () => {
    expect(failedItem(createEntityId('unit-1'), new Error('failure'))).toEqual({
      id: createEntityId('unit-1'),
      outcome: 'failed',
      code: 'Error',
      message: 'failure',
    });
  });

  it('Given an unknown failure, When failedItem normalizes it, Then it provides stable fallback fields', () => {
    expect(failedItem(createEntityId('unit-1'), 'failure')).toEqual({
      id: createEntityId('unit-1'),
      outcome: 'failed',
      code: 'unknown',
      message: 'Unknown failure',
    });
  });

  it('Given completed item outcomes, When updateProgress applies a chunk, Then it updates counters and retry metadata', () => {
    const operation = createInitialOperation(request, now, createEntityId('batch-1'));
    expect(
      updateProgress(
        initialProgress(operation, 2, now),
        createEntityId('chunk-1'),
        [
          { id: createEntityId('unit-1'), outcome: 'warning' },
          { id: createEntityId('unit-2'), outcome: 'failed' },
        ],
        { kind: 'instant', epochMilliseconds: 2_000 },
      ),
    ).toMatchObject({
      currentChunk: createEntityId('chunk-1'),
      processed: 2,
      warnings: 1,
      failures: 1,
      retryCount: 1,
    });
  });

  it('Given an operation, When initialProgress projects it, Then it replaces only the update timestamp and total', () => {
    const operation = createInitialOperation(request, now, createEntityId('batch-1'));
    expect(initialProgress(operation, 3, { kind: 'instant', epochMilliseconds: 2_000 })).toMatchObject({
      batchId: createEntityId('batch-1'),
      total: 3,
      updatedAt: { kind: 'instant', epochMilliseconds: 2_000 },
    });
  });

  it('Given a request and ids, When fingerprints are created, Then request and materialized identities are stable', () => {
    expect(requestFingerprint(request)).toContain('units');
    expect(fingerprint(request, [createEntityId('unit-1')])).toContain('unit-1');
    expect(fingerprint(request, [createEntityId('unit-1')])).toBe(
      fingerprint(request, [createEntityId('unit-1')]),
    );
  });

  it('Given implementation fields, When publicProgress projects them, Then it exposes only progress data', () => {
    const operation = createInitialOperation(request, now, createEntityId('batch-1'));
    const progress = publicProgress({ ...operation, fingerprint: 'private' });
    expect(progress).not.toHaveProperty('request');
    expect(progress).not.toHaveProperty('fingerprint');
    expect(progress.batchId).toBe(createEntityId('batch-1'));
  });

  it.each([
    [1, 0, 'failed'],
    [0, 1, 'completed-with-warnings'],
    [0, 0, 'completed'],
  ] as const)('Given %s failures and %s warnings, When terminalStatus resolves them, Then it returns %s', (failures, warnings, expected) => {
    expect(terminalStatus(failures, warnings)).toBe(expected);
  });

  it('Given work items and a concurrency limit, When executeWithConcurrency runs them, Then it preserves input order', async () => {
    await expect(
      executeWithConcurrency([1, 2, 3], 2, async (value) => value * 2),
    ).resolves.toEqual([2, 4, 6]);
  });

  it('Given an initial request, When createInitialOperation creates state, Then it starts materializing with empty ids', () => {
    const operation = createInitialOperation(request, now, createEntityId('batch-1'));
    expect(operation).toMatchObject({
      batchId: createEntityId('batch-1'),
      status: 'materializing',
      ids: [],
      total: 0,
    });
  });

  it('Given a batch execution with warning and failure outcomes, When executeMemoryBatch runs it, Then it persists the terminal projection', async () => {
    const operation = createInitialOperation(request, now, createEntityId('batch-1'));
    const operations = new Map([[operation.batchId, operation]]);
    const result = await executeMemoryBatch(
      operation.batchId,
      { ...operation, ids: [createEntityId('unit-1'), createEntityId('unit-2')] },
      {
        clock: { now: () => now },
        materialize: () => [],
        execute: async (id) =>
          id.endsWith('1')
            ? { id, outcome: 'warning' }
            : { id, outcome: 'failed', message: 'failure' },
      },
      2,
      1,
      operations,
    );
    expect(result.status).toBe('failed');
    expect(operations.get(operation.batchId)?.failures).toBe(1);
  });

  it('Given a batch error code and message, When batchError creates the error, Then it returns the domain error', () => {
    expect(batchError('conflict', 'already changed')).toMatchObject({
      code: 'conflict',
      message: 'already changed',
    });
  });
});
