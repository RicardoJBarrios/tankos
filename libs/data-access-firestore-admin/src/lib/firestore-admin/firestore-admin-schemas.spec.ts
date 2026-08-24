import { Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';
import {
  firestoreAdminBatchChunkSchema,
  firestoreAdminBatchDtoSchema,
} from './firestore-admin-schemas';

describe('Firestore Admin batch schemas', () => {
  it('Given a valid summary DTO, When parsed, Then accepts Firestore timestamps and lifecycle values', () => {
    const timestamp = Timestamp.fromMillis(0);

    expect(
      firestoreAdminBatchDtoSchema.parse({
        batchId: 'batch-1',
        principalId: 'keeper-1',
        schema: 'units',
        operation: 'update',
        status: 'queued',
        total: 1,
        processed: 0,
        warnings: 0,
        failures: 0,
        retryCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        selection: { fingerprint: 'f', total: 1, chunkCount: 1 },
        requestedSelection: { kind: 'ids', ids: ['unit-1'] },
        requestFingerprint: 'f',
      }),
    ).toMatchObject({ batchId: 'batch-1' });
  });

  it('Given malformed persisted data, When parsed, Then rejects it', () => {
    expect(() =>
      firestoreAdminBatchDtoSchema.parse({ status: 'running' }),
    ).toThrow();
  });

  it('Given a chunk with an invalid counter, When parsed, Then rejects it', () => {
    expect(() =>
      firestoreAdminBatchChunkSchema.parse({
        chunkId: 'chunk-1',
        ids: ['unit-1'],
        status: 'pending',
        attempts: -1,
      }),
    ).toThrow();
  });
});
