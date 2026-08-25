import { describe, expect, it, vi } from 'vitest';
import type { AtomicBatchOperation, AtomicBatchPort } from '../core';
import { runForegroundBatch } from './foreground-batch-runner';

const operations: readonly AtomicBatchOperation[] = [
  { kind: 'delete', path: 'units/one' },
  { kind: 'delete', path: 'units/two' },
  { kind: 'delete', path: 'units/three' },
];

function port(commit: AtomicBatchPort['commit'] = async () => undefined) {
  return { commit };
}

describe('runForegroundBatch', () => {
  it('Given operations, When run in bounded chunks, Then commits sequentially and reports completion', async () => {
    const commit = vi.fn().mockResolvedValue(undefined);
    const onProgress = vi.fn();
    const result = await runForegroundBatch(port(commit), operations, {
      operationKey: 'operation-1',
      chunkSize: 2,
      onProgress,
    });

    expect(commit).toHaveBeenNthCalledWith(1, operations.slice(0, 2));
    expect(commit).toHaveBeenNthCalledWith(2, operations.slice(2));
    expect(result.progress).toMatchObject({
      status: 'completed',
      completedOperations: 3,
    });
    expect(result.checkpoint.nextOperationIndex).toBe(3);
    expect(onProgress).toHaveBeenCalledTimes(3);
  });

  it('Given a checkpoint, When resumed, Then starts at the next uncommitted operation', async () => {
    const commit = vi.fn().mockResolvedValue(undefined);
    const result = await runForegroundBatch(port(commit), operations, {
      operationKey: 'operation-1',
      checkpoint: { operationKey: 'operation-1', nextOperationIndex: 2 },
    });

    expect(commit).toHaveBeenCalledWith([operations[2]]);
    expect(result.progress.status).toBe('completed');
  });

  it('Given a cancellation request, When the next chunk is about to start, Then returns a resumable cancelled result', async () => {
    const commit = vi.fn().mockResolvedValue(undefined);
    const result = await runForegroundBatch(port(commit), operations, {
      operationKey: 'operation-1',
      shouldCancel: () => true,
    });

    expect(commit).not.toHaveBeenCalled();
    expect(result.progress.status).toBe('cancelled');
    expect(result.checkpoint.nextOperationIndex).toBe(0);
  });

  it('Given a failed chunk, When run, Then returns the same checkpoint and the error', async () => {
    const error = new Error('offline');
    const commit = vi.fn().mockRejectedValue(error);
    const result = await runForegroundBatch(port(commit), operations, {
      operationKey: 'operation-1',
      chunkSize: 2,
    });

    expect(result.progress.status).toBe('failed');
    expect(result.checkpoint.nextOperationIndex).toBe(0);
    expect(result.error).toBe(error);
  });

  it.each([
    ['', undefined],
    ['operation-1', 0],
    ['operation-1', 501],
    ['operation-1', 1.5],
  ] as const)(
    'Given invalid options %j/%j, When run, Then rejects before committing',
    async (operationKey, chunkSize) => {
      await expect(
        runForegroundBatch(port(), operations, { operationKey, chunkSize }),
      ).rejects.toThrow();
    },
  );

  it('Given a checkpoint for another operation, When resumed, Then rejects it', async () => {
    await expect(
      runForegroundBatch(port(), operations, {
        operationKey: 'operation-1',
        checkpoint: { operationKey: 'operation-2', nextOperationIndex: 0 },
      }),
    ).rejects.toThrow();
  });

  it('Given an invalid checkpoint index, When resumed, Then rejects it', async () => {
    await expect(
      runForegroundBatch(port(), operations, {
        operationKey: 'operation-1',
        checkpoint: { operationKey: 'operation-1', nextOperationIndex: 4 },
      }),
    ).rejects.toThrow(RangeError);
  });
});
