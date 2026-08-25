import type { AtomicBatchOperation, AtomicBatchPort } from '../core';

export type ForegroundBatchStatus = 'completed' | 'cancelled' | 'failed';

export interface ForegroundBatchCheckpoint {
  readonly operationKey: string;
  readonly nextOperationIndex: number;
}

export interface ForegroundBatchProgress {
  readonly operationKey: string;
  readonly status: ForegroundBatchStatus;
  readonly totalOperations: number;
  readonly completedOperations: number;
  readonly chunkSize: number;
  readonly nextOperationIndex: number;
}

export interface ForegroundBatchRunOptions {
  readonly operationKey: string;
  readonly chunkSize?: number;
  readonly checkpoint?: ForegroundBatchCheckpoint;
  readonly shouldCancel?: () => boolean | Promise<boolean>;
  readonly onProgress?: (
    progress: ForegroundBatchProgress,
  ) => void | Promise<void>;
}

export interface ForegroundBatchResult {
  readonly progress: ForegroundBatchProgress;
  readonly checkpoint: ForegroundBatchCheckpoint;
  readonly error?: unknown;
}

/** Runs bounded atomic chunks in the foreground and returns a resumable checkpoint. */
export async function runForegroundBatch<TDocument = unknown>(
  atomicBatch: AtomicBatchPort<TDocument>,
  operations: readonly AtomicBatchOperation<TDocument>[],
  options: ForegroundBatchRunOptions,
): Promise<ForegroundBatchResult> {
  const chunkSize = validateOptions(options);
  let nextOperationIndex = validateCheckpoint(
    options.checkpoint,
    options.operationKey,
    operations.length,
  );

  while (nextOperationIndex < operations.length) {
    if (await options.shouldCancel?.())
      return finish(
        'cancelled',
        options,
        operations.length,
        chunkSize,
        nextOperationIndex,
      );

    const chunk = operations.slice(
      nextOperationIndex,
      nextOperationIndex + chunkSize,
    );
    try {
      await atomicBatch.commit(chunk);
    } catch (error) {
      return {
        progress: createProgress(
          'failed',
          options.operationKey,
          operations.length,
          nextOperationIndex,
          chunkSize,
        ),
        checkpoint: createCheckpoint(options.operationKey, nextOperationIndex),
        error,
      };
    }
    nextOperationIndex += chunk.length;
    await options.onProgress?.(
      createProgress(
        'completed',
        options.operationKey,
        operations.length,
        nextOperationIndex,
        chunkSize,
      ),
    );
  }

  return finish(
    'completed',
    options,
    operations.length,
    chunkSize,
    nextOperationIndex,
  );
}

function validateOptions(options: ForegroundBatchRunOptions): number {
  if (!options.operationKey.trim())
    throw new TypeError('Foreground batch operationKey must be non-empty');
  const chunkSize = options.chunkSize ?? 500;
  if (!isValidChunkSize(chunkSize))
    throw new RangeError(
      'Foreground batch chunkSize must be between 1 and 500',
    );
  return chunkSize;
}

function validateCheckpoint(
  checkpoint: ForegroundBatchCheckpoint | undefined,
  operationKey: string,
  totalOperations: number,
): number {
  if (checkpoint === undefined) return 0;
  if (checkpoint.operationKey !== operationKey)
    throw new Error('Foreground batch checkpoint belongs to another operation');
  if (!isValidCheckpointIndex(checkpoint.nextOperationIndex, totalOperations))
    throw new RangeError('Foreground batch checkpoint index is invalid');
  return checkpoint.nextOperationIndex;
}

function isValidChunkSize(value: number): boolean {
  return Number.isSafeInteger(value) && isBetweenInclusive(value, 1, 500);
}

function isValidCheckpointIndex(
  value: number,
  totalOperations: number,
): boolean {
  return (
    Number.isSafeInteger(value) && isBetweenInclusive(value, 0, totalOperations)
  );
}

function isBetweenInclusive(
  value: number,
  minimum: number,
  maximum: number,
): boolean {
  return value >= minimum && value <= maximum;
}

function createCheckpoint(
  operationKey: string,
  nextOperationIndex: number,
): ForegroundBatchCheckpoint {
  return { operationKey, nextOperationIndex };
}

function createProgress(
  status: ForegroundBatchStatus,
  operationKey: string,
  totalOperations: number,
  nextOperationIndex: number,
  chunkSize: number,
): ForegroundBatchProgress {
  return {
    operationKey,
    status,
    totalOperations,
    completedOperations: nextOperationIndex,
    chunkSize,
    nextOperationIndex,
  };
}

async function finish(
  status: ForegroundBatchStatus,
  options: ForegroundBatchRunOptions,
  totalOperations: number,
  chunkSize: number,
  nextOperationIndex: number,
): Promise<ForegroundBatchResult> {
  const progress = createProgress(
    status,
    options.operationKey,
    totalOperations,
    nextOperationIndex,
    chunkSize,
  );
  await options.onProgress?.(progress);
  return {
    progress,
    checkpoint: createCheckpoint(options.operationKey, nextOperationIndex),
  };
}
