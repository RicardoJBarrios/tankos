import {
  type BatchItemResult,
  type BatchOperationRecord,
  type BatchStorePort,
  type EntityId,
  type TechnicalTimestamp,
} from '@tank-os/data-access';

/** Dependencies for executing durable chunks with bounded item concurrency. */
export interface FirestoreAdminBatchExecutorOptions<TPayload> {
  readonly store: BatchStorePort<TPayload>;
  /** Mandatory trusted authorization gate executed before claiming a batch. */
  readonly authorize: (batchId: EntityId) => void | Promise<void>;
  /** Stable identity of this worker instance for crash recovery. */
  readonly workerId: string;
  /** Lease duration; it must exceed the maximum expected chunk runtime. */
  readonly leaseDurationMilliseconds?: number;
  /** Maximum number of chunks materialized into one worker invocation. */
  readonly maxChunks?: number;
  readonly now: () => TechnicalTimestamp;
  readonly execute: (
    id: EntityId,
    operation: BatchOperationRecord<TPayload>,
  ) => Promise<BatchItemResult>;
  readonly concurrency?: number;
  /** Removes detail documents after terminal completion. Defaults to true. */
  readonly cleanupTerminal?: boolean;
}

async function boundedMap<TItem, TResult>(
  items: readonly TItem[],
  concurrency: number,
  callback: (item: TItem) => Promise<TResult>,
): Promise<TResult[]> {
  const results = new Array<TResult>(items.length);
  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await callback(items[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

/** Creates the trusted worker that executes persisted Firestore batch chunks. */
export function createFirestoreAdminBatchExecutor<TPayload = unknown>(
  options: FirestoreAdminBatchExecutorOptions<TPayload>,
): { run(batchId: EntityId): Promise<BatchOperationRecord<TPayload>> } {
  const concurrency = options.concurrency ?? 8;
  const leaseDurationMilliseconds = options.leaseDurationMilliseconds ?? 60_000;
  const maxChunks = options.maxChunks ?? 1_000;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
    throw new RangeError(
      'Batch executor concurrency must be an integer between 1 and 32',
    );
  }
  if (
    typeof options.workerId !== 'string' ||
    !options.workerId.trim() ||
    !Number.isInteger(leaseDurationMilliseconds) ||
    leaseDurationMilliseconds < 1 ||
    !Number.isInteger(maxChunks) ||
    maxChunks < 1
  ) {
    throw new RangeError('Batch worker identity and lease duration are invalid');
  }
  return {
    async run(batchId) {
      await options.authorize(batchId);
      const claim = await options.store.claim(batchId, {
        workerId: options.workerId,
        now: options.now(),
        leaseDurationMilliseconds,
      });
      if (!claim.claimed) return claim.record;
      let current = claim.record;
      const chunks = await options.store.listRunnableChunks(batchId, maxChunks + 1);
      if (chunks.length > maxChunks) {
        throw new RangeError(
          `Batch execution exceeds the ${maxChunks} chunk limit`,
        );
      }
      for (const chunk of chunks) {
        if (await options.store.isCancellationRequested(batchId)) {
          current = await options.store.update(batchId, {
            status: 'cancelled',
            updatedAt: options.now(),
            leaseOwner: null,
            leaseUntil: null,
          });
          return current;
        }
        await options.store.putChunk(batchId, {
          ...chunk,
          status: 'running',
          attempts: chunk.attempts + 1,
        });
        const results = await boundedMap(chunk.ids, concurrency, async (id) => {
          try {
            return await options.execute(id, current);
          } catch (error) {
            return {
              id,
              outcome: 'failed' as const,
              code: error instanceof Error ? error.name : 'unknown',
              message:
                error instanceof Error ? error.message : 'Unknown failure',
            };
          }
        });
        const attempt = {
          succeeded: results.filter((result) => result.outcome === 'succeeded').length,
          warnings: results.filter((result) => result.outcome === 'warning').length,
          failures: results.filter((result) => result.outcome === 'failed').length,
        };
        const previous = {
          succeeded: chunk.succeeded ?? 0,
          warnings: chunk.warnings ?? 0,
          failures: chunk.failures ?? 0,
        };
        for (const result of results)
          await options.store.putResult(batchId, chunk.chunkId, result);
        await options.store.putChunk(batchId, {
          ...chunk,
          status: attempt.failures > 0 ? 'failed' : 'completed',
          attempts: chunk.attempts + 1,
          ...attempt,
        });
        const updatedAt = options.now();
        current = await options.store.update(batchId, {
          processed:
            current.processed +
            attempt.succeeded +
            attempt.warnings -
            previous.succeeded -
            previous.warnings,
          warnings: current.warnings + attempt.warnings - previous.warnings,
          failures: current.failures + attempt.failures - previous.failures,
          currentChunk: chunk.chunkId,
          retryCount: current.retryCount + (chunk.attempts > 0 ? 1 : 0),
          updatedAt,
          leaseOwner: options.workerId,
          leaseUntil: {
            kind: 'instant',
            epochMilliseconds:
              updatedAt.epochMilliseconds + leaseDurationMilliseconds,
          },
        });
      }
      const terminal = await options.store.update(batchId, {
        status:
          current.failures > 0
            ? 'failed'
            : current.warnings > 0
              ? 'completed-with-warnings'
              : 'completed',
        updatedAt: options.now(),
        leaseOwner: null,
        leaseUntil: null,
      });
      if ((options.cleanupTerminal ?? true) && current.failures === 0) {
        await options.store.remove(batchId);
      }
      return terminal;
    },
  };
}
