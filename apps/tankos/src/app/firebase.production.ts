import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { createFirebaseAuthSession } from '@tankos/authn-firebase';
import {
  TANKOS_FIREBASE_APP_CHECK_SITE_KEY,
  TANKOS_FIREBASE_CONFIG,
} from './firebase.production.config';

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

/**
 * App Check is deliberately lazy so the SDK is not loaded until a real site
 * key is configured. Rules remain the authorization boundary; App Check only
 * reduces abuse from non-TankOS clients.
 */
export const tankosAppCheck = TANKOS_FIREBASE_APP_CHECK_SITE_KEY
  ? import('firebase/app-check').then(
      ({ initializeAppCheck, ReCaptchaEnterpriseProvider }) =>
        initializeAppCheck(firebaseApp, {
          provider: new ReCaptchaEnterpriseProvider(
            TANKOS_FIREBASE_APP_CHECK_SITE_KEY,
          ),
          isTokenAutoRefreshEnabled: true,
        }),
    )
  : undefined;
