import {
  connectFirestoreEmulator,
  Firestore,
  initializeFirestore,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getFirebaseAuthClient } from './firebase-auth-client';

let client: { readonly auth: Auth; readonly firestore: Firestore } | undefined;

export function getFirebaseClient() {
  if (client) return client;

  const auth = getFirebaseAuthClient();
  const firestore = initializeFirestore(getApp(), {
    experimentalForceLongPolling: true,
  });

  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  client = { auth, firestore };
  return client;
}
