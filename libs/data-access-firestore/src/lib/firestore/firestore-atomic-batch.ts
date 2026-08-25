import type {
  AtomicBatchOperation,
  AtomicBatchPort,
} from '@tankos/data-access';
import type { Firestore } from 'firebase/firestore';
import * as firestoreSdk from 'firebase/firestore';
import { firestoreErrorCode } from './firestore-crud-repository';
import { handleFirestoreError } from './firestore-crud-repository-policy';

/** Firestore's hard limit for one client-side atomic write batch. */
export const FIRESTORE_ATOMIC_BATCH_LIMIT = 500;

export interface FirestoreAtomicBatchOptions {
  readonly firestore: Firestore;
}

/** Creates a client-side finite atomic batch backed by Firestore Rules. */
export function createFirestoreAtomicBatch(
  options: FirestoreAtomicBatchOptions,
): AtomicBatchPort {
  return {
    async commit(operations) {
      validateOperations(operations);
      const batch = firestoreSdk.writeBatch(options.firestore);
      try {
        for (const operation of operations) {
          const reference = firestoreSdk.doc(
            options.firestore,
            validateDocumentPath(operation.path),
          );
          if (operation.kind === 'set') {
            batch.set(reference, operation.document);
          } else if (operation.kind === 'update') {
            batch.update(reference, operation.patch);
          } else {
            batch.delete(reference);
          }
        }
        await batch.commit();
      } catch (error) {
        throw handleFirestoreError(
          error,
          firestoreErrorCode(error) ?? 'transient',
          'Firestore atomic batch failed',
        );
      }
    },
  };
}

function validateOperations(operations: readonly AtomicBatchOperation[]): void {
  if (!Array.isArray(operations))
    throw new TypeError('Atomic batch operations must be an array');
  const entries = operations as unknown as readonly AtomicBatchOperation[];
  if (entries.length > FIRESTORE_ATOMIC_BATCH_LIMIT)
    throw new RangeError(
      `Firestore atomic batches cannot exceed ${String(FIRESTORE_ATOMIC_BATCH_LIMIT)} operations`,
    );
  for (const operation of entries) validateDocumentPath(operation.path);
}

function validateDocumentPath(path: string): string {
  if (typeof path !== 'string' || !path.trim())
    throw new TypeError('Firestore document paths must be non-empty strings');
  const segments = path.split('/');
  if (
    segments.length % 2 !== 0 ||
    segments.some((segment) => segment.length === 0)
  )
    throw new TypeError(
      'Firestore document paths must contain collection/document pairs',
    );
  return path;
}
