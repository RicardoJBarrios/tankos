import { getApp } from 'firebase/app';
import * as firestoreFull from 'firebase/firestore';
import {
  Firestore as LiteFirestore,
  getFirestore as getLiteFirestore,
} from 'firebase/firestore/lite';
import * as firestoreLite from 'firebase/firestore/lite';
import { getFirebaseAuthClient } from './firebase-auth-client';
import { getFirebaseClient } from './firebase-client';
import { firebaseConfig } from './firebase-runtime-config';

export type FirestoreReadModule = Pick<
  typeof firestoreLite,
  | 'collection'
  | 'doc'
  | 'documentId'
  | 'getDoc'
  | 'getDocs'
  | 'limit'
  | 'orderBy'
  | 'query'
  | 'where'
>;

let firestore: LiteFirestore | undefined;
let readModule: FirestoreReadModule | undefined;

/**
 * Provides the read-only Firestore API while keeping emulator support in dev.
 * Firestore Lite has no emulator connector, so demo-veril intentionally uses
 * the full SDK and production uses Lite.
 */
export function getFirestoreReadClient(): {
  readonly firestore: LiteFirestore;
  readonly module: FirestoreReadModule;
} {
  if (firestore && readModule) return { firestore, module: readModule };

  if (firebaseConfig.projectId === 'demo-veril') {
    firestore = getFirebaseClient().firestore as unknown as LiteFirestore;
    readModule = firestoreFull as unknown as FirestoreReadModule;
  } else {
    getFirebaseAuthClient();
    firestore = getLiteFirestore(getApp());
    readModule = firestoreLite;
  }

  return { firestore, module: readModule };
}

export function isFirestoreTimestamp(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    'nanoseconds' in value &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  );
}
