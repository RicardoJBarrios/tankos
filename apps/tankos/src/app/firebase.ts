import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
} from 'firebase/firestore';
import { createLocalFirebaseAuthSession } from '@tankos/auth';

const FIRESTORE_EMULATOR_PORT = 8080;

const firebaseApp =
  getApps()[0] ??
  initializeApp({
    // These are public emulator-only identifiers, not production credentials.
    // eslint-disable-next-line ai-guard/no-hardcoded-secret
    apiKey: 'demo-tankos-local',
    authDomain: 'demo-tankos.firebaseapp.com',
    projectId: 'demo-tankos',
    appId: 'demo-tankos-local',
  });

export const tankosAuth = getAuth(firebaseApp);
export const tankosAuthSession = createLocalFirebaseAuthSession(tankosAuth);
// WebKit can keep Firestore's WebChannel request open against the local
// emulator. Long polling keeps the same emulator integration reliable in all
// supported E2E browsers.
export const tankosFirestore = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true,
});

if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  connectAuthEmulator(tankosAuth, 'http://127.0.0.1:9099', {
    disableWarnings: true,
  });
  connectFirestoreEmulator(
    tankosFirestore,
    '127.0.0.1',
    FIRESTORE_EMULATOR_PORT,
  );
}
