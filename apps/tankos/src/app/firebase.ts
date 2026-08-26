import { getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

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
export const tankosFirestore = getFirestore(firebaseApp);

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

/** Signs the local development user in, creating it in the Auth emulator once. */
export async function ensureTankOsLocalUser(): Promise<User> {
  if (tankosAuth.currentUser) return tankosAuth.currentUser;
  const email = 'developer@tankos.local';
  // This credential exists only in the local Auth emulator.
  // eslint-disable-next-line ai-guard/no-hardcoded-secret, sonarjs/no-hardcoded-passwords
  const password = 'tankos-local-dev';
  try {
    return (await signInWithEmailAndPassword(tankosAuth, email, password)).user;
  } catch (error) {
    if (!isMissingUser(error)) throw error;
    return (await createUserWithEmailAndPassword(tankosAuth, email, password))
      .user;
  }
}

function isMissingUser(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'auth/user-not-found'
  );
}
