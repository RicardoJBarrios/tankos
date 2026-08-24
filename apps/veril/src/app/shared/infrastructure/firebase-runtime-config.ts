import { isDevMode } from '@angular/core';

const isLocalBrowser =
  typeof globalThis.location !== 'undefined' &&
  (globalThis.location.hostname === 'localhost' ||
    globalThis.location.hostname === '127.0.0.1');
const useEmulatorConfiguration = isDevMode() || isLocalBrowser;

export const firebaseConfig = useEmulatorConfiguration
  ? {
      apiKey: 'demo-veril-api-key',
      authDomain: 'demo-veril.firebaseapp.com',
      projectId: 'demo-veril',
      appId: 'demo-veril-app',
    }
  : {
      apiKey: 'AIzaSyDQMJYn-vI9T7aFA6fcMWNCQQo3BpdBI1g',
      authDomain: 'tankos.firebaseapp.com',
      projectId: 'tankos',
      appId: '1:769994254528:web:b5d309091934dcffca2525',
    };

export const appCheckSiteKey = useEmulatorConfiguration
  ? undefined
  : (globalThis as { __VERIL_APP_CHECK_SITE_KEY__?: string })
      .__VERIL_APP_CHECK_SITE_KEY__;
