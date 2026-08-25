import type { ClockPort } from '@tankos/time';
import type {
  BatchMaterializerPort,
  BatchMaterializerStorePort,
  BatchOperationPort,
  BatchRequest,
  EntityId,
} from '../core';
import { BatchSubmissionServiceImplementation } from './batch-submission-service-implementation';

/** Dependencies for durable, asynchronous batch submission. */
export interface BatchSubmissionServiceOptions<TPayload, TFilter> {
  readonly store: BatchSubmissionStorePort<TPayload>;
  /** Fenced persistence capability used only while resolving selections. */
  readonly materializerStore: BatchMaterializerStorePort<TPayload>;
  readonly materializer: BatchMaterializerPort<TFilter>;
  /** Technical clock supplied by the host, normally backed by `TimeService`. */
  readonly clock: ClockPort;
  readonly createBatchId: (
    request: BatchRequest<TPayload, TFilter>,
  ) => EntityId;
  readonly chunkSize?: number;
  /** Maximum number of target ids accepted for one logical batch. */
  readonly maxTargets?: number;
  /** Maximum serialized request size, kept below the Firestore document limit. */
  readonly maxRequestBytes?: number;
  /** Stable identity used to claim filter materialization. */
  readonly materializerOwnerId?: string;
  /** Lease duration for filter materialization. */
  readonly materializationLeaseDurationMilliseconds?: number;
}

/** Creates a submission boundary that persists materialization progress. */
export function createBatchSubmissionService<
  TPayload = unknown,
  TFilter = unknown,
>(
  options: BatchSubmissionServiceOptions<TPayload, TFilter>,
): BatchOperationPort<TPayload, TFilter> {
  return new BatchSubmissionServiceImplementation(options);
}
