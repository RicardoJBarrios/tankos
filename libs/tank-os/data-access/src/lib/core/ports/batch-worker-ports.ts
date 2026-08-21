import type { AccessContext, BatchProgress, EntityId } from '../value-types';

/** Authorization boundary used before a trusted batch worker executes. */
export interface BatchAuthorizationPort {
  /** Authorizes one batch for the supplied request context. */
  authorize(batchId: EntityId, access: AccessContext): Promise<void>;
}

/** Execution boundary implemented by a trusted batch worker host. */
export interface BatchExecutionPort {
  /** Executes a previously submitted batch. */
  run(batchId: EntityId): Promise<BatchProgress>;
}
