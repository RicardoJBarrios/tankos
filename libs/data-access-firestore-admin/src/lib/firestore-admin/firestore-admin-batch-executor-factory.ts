import {
  createDataAccessError,
  type BatchOperationRecord,
  type EntityId,
} from '@tankos/data-access';
import {
  executeClaimedChunks,
  validateExecutorOptions,
  type FirestoreAdminBatchExecutorOptions,
} from './firestore-admin-batch-executor';

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
