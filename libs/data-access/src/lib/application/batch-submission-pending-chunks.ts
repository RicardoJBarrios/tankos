import { createEntityId } from '../core';
import type { EntityId } from '../core';
import { createPendingChunk } from './batch-submission-pending-chunk';

/** Splits materialized ids into durable chunks. */
export function createPendingChunks(
  ids: readonly EntityId[],
  chunkSize: number,
) {
  return Array.from({ length: Math.ceil(ids.length / chunkSize) }, (_, index) =>
    createPendingChunk(
      createEntityId(`chunk-${String(index + 1)}`),
      ids.slice(index * chunkSize, index * chunkSize + chunkSize),
    ),
  );
}
