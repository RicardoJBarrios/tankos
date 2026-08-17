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
      apiKey: 'AIzaSyBDhwznoPbQ9FEwDaMZshW5fZ0Z3OPIYTM',
      authDomain: 'veril-dd4e1.firebaseapp.com',
      projectId: 'veril-dd4e1',
      appId: '1:147729567472:web:d67b81c8864b93a3543c35',
    };

export const appCheckSiteKey = useEmulatorConfiguration
  ? undefined
  : (globalThis as { __VERIL_APP_CHECK_SITE_KEY__?: string })
      .__VERIL_APP_CHECK_SITE_KEY__;
