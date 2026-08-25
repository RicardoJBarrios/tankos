import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  ReCaptchaEnterpriseProvider,
  initializeAppCheck,
} from 'firebase/app-check';
import {
  Auth,
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  initializeAuth,
} from 'firebase/auth';
import { appCheckSiteKey, firebaseConfig } from './firebase-runtime-config';

let auth: Auth | undefined;

export function getFirebaseAuthClient(): Auth {
  if (auth) return auth;

  const hasExistingApp = getApps().length > 0;
  const app = hasExistingApp ? getApp() : initializeApp(firebaseConfig);
  if (!isDevEnvironment() && !appCheckSiteKey) {
    throw new Error('Firebase App Check site key is not configured');
  }

  auth = hasExistingApp
    ? getAuth(app)
    : initializeAuth(app, { persistence: browserSessionPersistence });

  if (appCheckSiteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }

  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
    disableWarnings: true,
  });
  return auth;
}

function isDevEnvironment(): boolean {
  return firebaseConfig.projectId === 'demo-veril';
}
