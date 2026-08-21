import type { BatchOperationPort } from './batch-operation-port';

/** Canonical logical-batch application contract. */
export type BatchSubmissionPort<TPayload = unknown, TFilter = unknown> =
  BatchOperationPort<TPayload, TFilter>;
