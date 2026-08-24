import {
  createDataAccessError,
  type BatchItemResult,
  type BatchLease,
  type BatchOperationRecord,
  type BatchSubmissionStorePort,
  type BatchWorkerStorePort,
  type EntityId,
} from '@tankos/data-access';
import {
  boundedMap,
  createItemFailure,
  summarizeResults,
  terminalStatus,
} from './firestore-admin-batch-execution-support';
import type { ClockPort } from '@tankos/time';

/** Dependencies for executing durable chunks with bounded item concurrency. */
export interface FirestoreAdminBatchExecutorOptions<TPayload> {
  readonly store: BatchWorkerStorePort<TPayload>;
  /** Mandatory trusted authorization gate executed before claiming a batch. */
  readonly authorize: (
    batchId: EntityId,
    callerPrincipalId: EntityId,
    submittedPrincipalId: EntityId,
  ) => void | Promise<void>;
  /** Stable identity of this worker instance for crash recovery. */
  readonly workerId: string;
  /** Lease duration; it must exceed the maximum expected chunk runtime. */
  readonly leaseDurationMilliseconds?: number;
  /** Maximum number of chunks materialized into one worker invocation. */
  readonly maxChunks?: number;
  /** Technical clock supplied by the trusted host, normally backed by `TimeService`. */
  readonly clock: ClockPort;
  readonly execute: (
    id: EntityId,
    operation: BatchOperationRecord<TPayload>,
  ) => Promise<BatchItemResult>;
  readonly concurrency?: number;
  /** Enables terminal cleanup after successful completion. Defaults to false. */
  readonly cleanupTerminal?: boolean;
  /** Separate control capability used for destructive terminal cleanup. */
  readonly cleanup?: Pick<BatchSubmissionStorePort<TPayload>, 'remove'>;
}

function validateExecutorOptions<TPayload>(
  options: FirestoreAdminBatchExecutorOptions<TPayload>,
  values: {
    readonly concurrency: number;
    readonly leaseDurationMilliseconds: number;
    readonly maxChunks: number;
    readonly cleanupTerminal: boolean;
  },
): void {
  assertCleanupConfiguration(values.cleanupTerminal, options.cleanup);
  assertConcurrency(values.concurrency);
  assertWorkerConfiguration(
    options.workerId,
    values.leaseDurationMilliseconds,
    values.maxChunks,
  );
}

function assertCleanupConfiguration(
  cleanupTerminal: boolean,
  cleanup: FirestoreAdminBatchExecutorOptions<unknown>['cleanup'],
): void {
  if (cleanupTerminal && !cleanup) {
    throw new RangeError(
      'A cleanup capability is required when terminal cleanup is enabled',
    );
  }
}

function assertConcurrency(concurrency: number): void {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
    throw new RangeError(
      'Batch executor concurrency must be an integer between 1 and 32',
    );
  }
}

function assertWorkerConfiguration(
  workerId: string,
  leaseDurationMilliseconds: number,
  maxChunks: number,
): void {
  if (
    !workerId.trim() ||
    !Number.isInteger(leaseDurationMilliseconds) ||
    leaseDurationMilliseconds < 1 ||
    !Number.isInteger(maxChunks) ||
    maxChunks < 1
  ) {
    throw new RangeError(
      'Batch worker identity and lease duration are invalid',
    );
  }
}

async function executeClaimedChunks<TPayload>(
  options: FirestoreAdminBatchExecutorOptions<TPayload>,
  batchId: EntityId,
  claim: {
    readonly record: BatchOperationRecord<TPayload>;
    readonly lease: BatchLease;
  },
  concurrency: number,
  leaseDurationMilliseconds: number,
  maxChunks: number,
  cleanupTerminal: boolean,
  cleanup: FirestoreAdminBatchExecutorOptions<TPayload>['cleanup'],
): Promise<BatchOperationRecord<TPayload>> {
  const lease = claim.lease;
  let current = claim.record;
  const chunks = await options.store.listRunnableChunks(batchId, maxChunks + 1);
  if (chunks.length > maxChunks) {
    throw createDataAccessError(
      'validation',
      `Batch execution exceeds the ${maxChunks} chunk limit`,
    );
  }
  for (const chunk of chunks) {
    if (await options.store.isCancellationRequested(batchId)) {
      return options.store.update(
        batchId,
        {
          status: 'cancelled',
          updatedAt: options.clock.now(),
          leaseOwner: null,
          leaseUntil: null,
        },
        lease,
      );
    }
    current = await processChunk(
      options,
      batchId,
      chunk,
      current,
      lease,
      concurrency,
      leaseDurationMilliseconds,
    );
  }
  const terminal = await options.store.update(
    batchId,
    {
      status: terminalStatus(current.failures, current.warnings),
      updatedAt: options.clock.now(),
      leaseOwner: null,
      leaseUntil: null,
    },
    lease,
  );
  if (cleanupTerminal && current.failures === 0 && cleanup)
    await cleanup.remove(batchId);
  return terminal;
}

async function processChunk<TPayload>(
  options: FirestoreAdminBatchExecutorOptions<TPayload>,
  batchId: EntityId,
  chunk: Awaited<
    ReturnType<BatchWorkerStorePort<TPayload>['listRunnableChunks']>
  >[number],
  current: BatchOperationRecord<TPayload>,
  lease: BatchLease,
  concurrency: number,
  leaseDurationMilliseconds: number,
): Promise<BatchOperationRecord<TPayload>> {
  await options.store.putChunk(
    batchId,
    {
      ...chunk,
      status: 'running',
      attempts: chunk.attempts + 1,
    },
    lease,
  );
  const results = await executeChunkItems(
    options,
    current,
    chunk.ids,
    concurrency,
  );
  return completeChunk(
    options,
    batchId,
    chunk,
    current,
    results,
    lease,
    leaseDurationMilliseconds,
  );
}

async function completeChunk<TPayload>(
  options: FirestoreAdminBatchExecutorOptions<TPayload>,
  batchId: EntityId,
  chunk: Awaited<
    ReturnType<BatchWorkerStorePort<TPayload>['listRunnableChunks']>
  >[number],
  current: BatchOperationRecord<TPayload>,
  results: readonly BatchItemResult[],
  lease: BatchLease,
  leaseDurationMilliseconds: number,
): Promise<BatchOperationRecord<TPayload>> {
  const attempt = summarizeResults(results);
  const previous = {
    succeeded: chunk.succeeded ?? 0,
    warnings: chunk.warnings ?? 0,
    failures: chunk.failures ?? 0,
  };
  await options.store.putResults(batchId, chunk.chunkId, results, lease);
  await options.store.putChunk(
    batchId,
    {
      ...chunk,
      status: attempt.failures > 0 ? 'failed' : 'completed',
      attempts: chunk.attempts + 1,
      ...attempt,
    },
    lease,
  );
  const updatedAt = options.clock.now();
  return options.store.update(
    batchId,
    {
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
    },
    lease,
  );
}

async function executeChunkItems<TPayload>(
  options: FirestoreAdminBatchExecutorOptions<TPayload>,
  current: BatchOperationRecord<TPayload>,
  ids: readonly EntityId[],
  concurrency: number,
): Promise<readonly BatchItemResult[]> {
  return boundedMap(ids, concurrency, async (id) => {
    try {
      return await options.execute(id, current);
    } catch (error) {
      return createItemFailure(id, error);
    }
  });
}

/** Creates the trusted worker that executes persisted Firestore batch chunks. */
export function createFirestoreAdminBatchExecutor<TPayload = unknown>(
  options: FirestoreAdminBatchExecutorOptions<TPayload>,
): {
  run(
    batchId: EntityId,
    callerPrincipalId: EntityId,
  ): Promise<BatchOperationRecord<TPayload>>;
} {
  const concurrency = options.concurrency ?? 8;
  const leaseDurationMilliseconds = options.leaseDurationMilliseconds ?? 60_000;
  const maxChunks = options.maxChunks ?? 1_000;
  const cleanupTerminal = options.cleanupTerminal ?? false;
  const cleanup = options.cleanup;
  validateExecutorOptions(options, {
    concurrency,
    leaseDurationMilliseconds,
    maxChunks,
    cleanupTerminal,
  });
  return {
    async run(batchId, callerPrincipalId) {
      const stored = await options.store.get(batchId);
      if (!stored) {
        throw createDataAccessError('not-found', 'Batch was not found');
      }
      await options.authorize(batchId, callerPrincipalId, stored.principalId);
      const claim = await options.store.claim(batchId, {
        ownerId: options.workerId,
        now: options.clock.now(),
        leaseDurationMilliseconds,
      });
      if (!claim.claimed) return claim.record;
      if (!claim.lease) {
        throw createDataAccessError(
          'conflict',
          'A claimed batch must include a fencing lease',
        );
      }
      return executeClaimedChunks(
        options,
        batchId,
        { record: claim.record, lease: claim.lease },
        concurrency,
        leaseDurationMilliseconds,
        maxChunks,
        cleanupTerminal,
        cleanup,
      );
    },
  };
}
