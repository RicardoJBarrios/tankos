import type { EntityId } from '../core';

/** Creates one pending chunk from a materialized id list. */
export function createPendingChunk(
  chunkId: EntityId,
  ids: readonly EntityId[],
) {
  return { chunkId, ids, status: 'pending' as const, attempts: 0 };
}
