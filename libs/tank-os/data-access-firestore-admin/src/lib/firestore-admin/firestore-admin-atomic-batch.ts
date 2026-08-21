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
      if (operations.length === 0)
        throw createDataAccessError(
          'validation',
          'An atomic batch needs at least one operation',
        );
      if (operations.length > maxOperations) {
        throw createDataAccessError(
          'validation',
          'The atomic batch exceeds its configured operation limit',
        );
      }
      try {
        const batch = options.firestore.batch();
        for (const operation of operations) {
          if (!operation.path.trim())
            throw createDataAccessError(
              'validation',
              'Atomic batch paths must be non-empty',
            );
          const reference = options.firestore.doc(operation.path);
          if (operation.kind === 'set')
            batch.set(reference, operation.document as DocumentData);
          if (operation.kind === 'update')
            batch.update(reference, operation.patch as DocumentData);
          if (operation.kind === 'delete') batch.delete(reference);
        }
        await batch.commit();
      } catch (error) {
        if (error instanceof Error && error.name === 'DataAccessError')
          throw error;
        throw createDataAccessError(
          'transient',
          'Firestore Admin atomic batch failed',
          error,
        );
      }
    },
  };
}
