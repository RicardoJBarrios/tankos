import type { BatchProgress, EntityId } from '../value-types';

/** Authorization boundary used before a trusted batch worker executes. */
export interface BatchAuthorizationPort {
  /** Authorizes the caller against the batch's persisted submitting principal. */
  authorize(
    batchId: EntityId,
    callerPrincipalId: EntityId,
    submittedPrincipalId: EntityId,
  ): Promise<void>;
}

/** Execution boundary implemented by a trusted batch worker host. */
export interface BatchExecutionPort {
  /** Executes a previously submitted batch. */
  run(batchId: EntityId, callerPrincipalId: EntityId): Promise<BatchProgress>;
}
