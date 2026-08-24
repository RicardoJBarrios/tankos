import {
  createDataAccessError,
  type AtomicBatchPort,
} from '@tank-os/data-access';
import type { DocumentData, Firestore } from 'firebase-admin/firestore';

/** Configuration for the finite all-or-nothing Firestore Admin writer. */
export interface FirestoreAdminAtomicBatchOptions {
  readonly firestore: Firestore;
  /** Safety limit below Firestore's provider request limits. */
  readonly maxOperations?: number;
}

function assertAtomicBatchSize(
  operations: readonly unknown[],
  maxOperations: number,
): void {
  if (operations.length === 0)
    throw createDataAccessError(
      'validation',
      'An atomic batch needs at least one operation',
    );
  if (operations.length > maxOperations)
    throw createDataAccessError(
      'validation',
      'The atomic batch exceeds its configured operation limit',
    );
}

function applyAtomicOperation<TDocument extends DocumentData>(
  batch: ReturnType<Firestore['batch']>,
  firestore: Firestore,
  operation: Parameters<AtomicBatchPort<TDocument>['commit']>[0][number],
): void {
  if (!operation.path.trim())
    throw createDataAccessError(
      'validation',
      'Atomic batch paths must be non-empty',
    );
  const reference = firestore.doc(operation.path);
  switch (operation.kind) {
    case 'set':
      batch.set(reference, operation.document as DocumentData);
      return;
    case 'update':
      batch.update(reference, operation.patch as DocumentData);
      return;
    case 'delete':
      batch.delete(reference);
  }
}

function mapAtomicBatchError(error: unknown): never {
  if (error instanceof Error && error.name === 'DataAccessError') throw error;
  throw createDataAccessError(
    'transient',
    'Firestore Admin atomic batch failed',
    error,
  );
}

/** Creates a Firestore Admin adapter for one finite atomic write batch. */
export function createFirestoreAdminAtomicBatch<
  TDocument extends DocumentData = DocumentData,
>(options: FirestoreAdminAtomicBatchOptions): AtomicBatchPort<TDocument> {
  const maxOperations = options.maxOperations ?? 400;
  if (
    !Number.isInteger(maxOperations) ||
    maxOperations < 1 ||
    maxOperations > 400
  ) {
    throw new RangeError(
      'Atomic batch operation limit must be an integer between 1 and 400',
    );
  }
  return {
    async commit(operations) {
      assertAtomicBatchSize(operations, maxOperations);
      try {
        const batch = options.firestore.batch();
        operations.forEach((operation) =>
          applyAtomicOperation(batch, options.firestore, operation),
        );
        await batch.commit();
      } catch (error) {
        mapAtomicBatchError(error);
      }
    },
  };
}
