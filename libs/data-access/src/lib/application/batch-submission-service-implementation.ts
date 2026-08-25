import type {
  BatchOperationPort,
  BatchProgress,
  BatchRequest,
  BatchSelection,
  EntityId,
} from '../core';
import { createBatchRequest, createDataAccessError } from '../core';
import type { BatchSubmissionServiceOptions } from './batch-submission-service';
import type { BatchLease } from '../core';
import { createMaterializationCancelledPatch } from './batch-submission-cancelled-patch';
import { createPendingChunks } from './batch-submission-pending-chunks';
import { createQueuedPatch } from './batch-submission-queued-patch';
import { createResumePatch } from './batch-submission-resume-patch';
import { project } from './batch-submission-progress';
import { resolveSubmissionConfiguration } from './batch-submission-service-configuration';
import { stableJson } from './batch-submission-stable-json';

/** Stateful implementation behind the public batch submission factory. */
export class BatchSubmissionServiceImplementation<
  TPayload,
  TFilter,
> implements BatchOperationPort<TPayload, TFilter> {
  readonly #options: BatchSubmissionServiceOptions<TPayload, TFilter>;
  readonly #configuration;

  constructor(options: BatchSubmissionServiceOptions<TPayload, TFilter>) {
    this.#options = options;
    this.#configuration = resolveSubmissionConfiguration(options);
  }

  async submit(input: BatchRequest<TPayload, TFilter>): Promise<BatchProgress> {
    const request = createBatchRequest(input);
    const requestFingerprint = stableJson({
      schema: request.schema,
      operation: request.operation,
      selection: request.selection,
      payload: request.payload,
    });
    this.#assertRequestSize(requestFingerprint);
    const now = this.#options.clock.now();
    const record = {
      batchId: this.#options.createBatchId(request),
      principalId: request.access.principalId,
      schema: request.schema,
      operation: request.operation,
      status: 'materializing' as const,
      total: 0,
      processed: 0,
      warnings: 0,
      failures: 0,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
      selection: { fingerprint: requestFingerprint, total: 0, chunkCount: 0 },
      requestedSelection: request.selection,
      payload: request.payload,
      requestFingerprint,
    };
    return project(
      await this.#options.store.create(record, request.idempotencyKey),
    );
  }

  async materialize(batchId: EntityId): Promise<BatchProgress> {
    const claim = await this.#options.materializerStore.claimMaterialization(
      batchId,
      {
        ownerId: this.#configuration.materializerOwnerId,
        now: this.#options.clock.now(),
        leaseDurationMilliseconds:
          this.#configuration.materializationLeaseDurationMilliseconds,
      },
    );
    const current = claim.record;
    if (!claim.claimed) return project(current);
    if (!claim.lease)
      throw createDataAccessError(
        'conflict',
        'A claimed materialization must include a fencing lease',
      );
    if (
      current.status !== 'materializing' ||
      current.requestedSelection === undefined
    ) {
      return project(current);
    }
    const ids = await this.#materializeSelection(
      current.requestedSelection as BatchSelection<TFilter>,
    );
    if (await this.#options.materializerStore.isCancellationRequested(batchId))
      return this.#cancelMaterialization(batchId, claim.lease);
    for (const chunk of createPendingChunks(ids, this.#configuration.chunkSize)) {
      await this.#options.materializerStore.putChunk(
        batchId,
        chunk,
        claim.lease,
      );
    }
    const queuedPatch = createQueuedPatch(
      current.requestFingerprint,
      ids.length,
      this.#configuration.chunkSize,
      this.#options.clock.now(),
    );
    const queued = await this.#options.materializerStore.update(
      batchId,
      queuedPatch,
      claim.lease,
    );
    return project(queued);
  }

  async get(batchId: EntityId): Promise<BatchProgress> {
    return project(await this.#options.store.get(batchId));
  }

  async resume(batchId: EntityId): Promise<BatchProgress> {
    const current = await this.#require(batchId);
    switch (current.status) {
      case 'queued':
      case 'completed':
      case 'cancelled':
        return project(current);
      case 'failed':
      case 'interrupted':
        break;
      default:
        throw createDataAccessError(
          'conflict',
          `Batch cannot be resumed from status ${current.status}`,
        );
    }
    const resumePatch = createResumePatch(this.#options.clock.now());
    const resumed = await this.#options.store.update(batchId, resumePatch);
    return project(resumed);
  }

  async cancel(batchId: EntityId): Promise<BatchProgress> {
    const current = await this.#require(batchId);
    if (current.status === 'completed' || current.status === 'cancelled')
      return project(current);
    return project(await this.#options.store.requestCancellation(batchId));
  }

  async #materializeSelection(
    selection: BatchSelection<TFilter>,
  ): Promise<readonly EntityId[]> {
    const ids = [
      ...(await this.#options.materializer.materialize(selection, {
        maxTargets: this.#configuration.maxTargets,
      })),
    ];
    if (ids.length > this.#configuration.maxTargets)
      throw createDataAccessError(
        'validation',
        `Batch selection exceeds the ${this.#configuration.maxTargets} target limit`,
      );
    if (new Set(ids).size !== ids.length)
      throw createDataAccessError(
        'validation',
        'Batch materializer returned duplicate target ids',
      );
    return ids;
  }

  async #cancelMaterialization(
    batchId: EntityId,
    lease: BatchLease,
  ): Promise<BatchProgress> {
    return project(
      await this.#options.materializerStore.update(
        batchId,
        createMaterializationCancelledPatch(this.#options.clock.now()),
        lease,
      ),
    );
  }

  async #require(batchId: EntityId) {
    const current = await this.#options.store.get(batchId);
    if (!current)
      throw createDataAccessError('not-found', 'Batch was not found');
    return current;
  }

  #assertRequestSize(requestFingerprint: string): void {
    if (
      new TextEncoder().encode(requestFingerprint).byteLength >
      this.#configuration.maxRequestBytes
    )
      throw createDataAccessError(
        'validation',
        `Batch request exceeds the ${this.#configuration.maxRequestBytes}-byte limit`,
      );
  }
}
