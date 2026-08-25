import { describe, expect, it } from 'vitest';
import { createEntityId } from '../core';
import { createPendingChunk } from './batch-submission-pending-chunk';

describe('createPendingChunk', () => {
  it('Given a chunk id and target ids, When creating a chunk, Then initializes it as pending', () => {
    const ids = [createEntityId('unit-1'), createEntityId('unit-2')];
    expect(createPendingChunk(createEntityId('chunk-1'), ids)).toEqual({
      chunkId: createEntityId('chunk-1'),
      ids,
      status: 'pending',
      attempts: 0,
    });
  });
});
