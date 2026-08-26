import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { createFirebaseAuthSession } from '@tankos/authn-firebase';
import { TANKOS_FIREBASE_CONFIG } from './firebase.production.config';

const firebaseApp =
  getApps()[0] ?? initializeApp(TANKOS_FIREBASE_CONFIG, 'tankos-production');

export const tankosAuth = getAuth(firebaseApp);
export const tankosAuthSession = createFirebaseAuthSession({
  auth: tankosAuth,
  email: '',
  password: '',
  roles: [],
  autoSignIn: false,
});
export const tankosFirestore = getFirestore(firebaseApp);
