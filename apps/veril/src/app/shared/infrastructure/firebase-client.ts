import { getApp, getApps, initializeApp } from 'firebase/app';
import { isDevMode } from '@angular/core';
import {
  Auth,
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  initializeAuth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  Firestore,
  initializeFirestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'demo-veril-api-key',
  authDomain: 'demo-veril.firebaseapp.com',
  projectId: 'demo-veril',
  appId: 'demo-veril-app',
};

let client: { readonly auth: Auth; readonly firestore: Firestore } | undefined;

export function getFirebaseClient() {
  if (client) {
    return client;
  }

  if (!isDevMode()) {
    throw new Error('Firebase production configuration is not configured');
  }

  const hasExistingApp = getApps().length > 0;
  const app = hasExistingApp ? getApp() : initializeApp(firebaseConfig);
  const auth = hasExistingApp
    ? getAuth(app)
    : initializeAuth(app, { persistence: browserSessionPersistence });
  const firestore = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });

  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
    disableWarnings: true,
  });
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);

  client = { auth, firestore };
  return client;
}
