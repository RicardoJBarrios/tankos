import { describe, expect, it } from 'vitest';
import { createEntityId } from '../core';
import { createPendingChunks } from './batch-submission-pending-chunks';

describe('createPendingChunks', () => {
  it('Given materialized ids, When creating pending chunks, Then splits them deterministically', () => {
    const ids = [1, 2, 3].map((id) => createEntityId(`unit-${id}`));
    expect(createPendingChunks(ids, 2)).toEqual([
      {
        chunkId: createEntityId('chunk-1'),
        ids: ids.slice(0, 2),
        status: 'pending',
        attempts: 0,
      },
      {
        chunkId: createEntityId('chunk-2'),
        ids: ids.slice(2),
        status: 'pending',
        attempts: 0,
      },
    ]);
  });

  it('Given no materialized ids, When creating pending chunks, Then returns an empty list', () => {
    expect(createPendingChunks([], 2)).toEqual([]);
  });
});
