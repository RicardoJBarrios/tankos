import type { FirebaseOptions } from 'firebase/app';

/** Public Firebase Web SDK configuration for the TankOS production project. */
export const TANKOS_FIREBASE_CONFIG: FirebaseOptions = {
  // Firebase Web API keys identify the project and are not service credentials.
  // eslint-disable-next-line ai-guard/no-hardcoded-secret
  apiKey: 'AIzaSyDQMJYn-vI9T7aFA6fcMWNCQQo3BpdBI1g',
  authDomain: 'tankos.firebaseapp.com',
  projectId: 'tankos',
  storageBucket: 'tankos.firebasestorage.app',
  messagingSenderId: '769994254528',
  appId: '1:769994254528:web:b5d309091934dcffca2525',
};

/**
 * Public reCAPTCHA Enterprise site key configured in Firebase App Check.
 * Keep empty in source control until the key is registered for this web app.
 * Production enforcement is enabled in the Firebase console after monitoring.
 */
export const TANKOS_FIREBASE_APP_CHECK_SITE_KEY = '' as string;
