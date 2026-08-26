import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getApps: vi.fn(() => []),
  initializeApp: vi.fn((config: unknown, name: string) => ({ config, name })),
  getAuth: vi.fn(() => ({ currentUser: null })),
  getFirestore: vi.fn(() => ({})),
  createFirebaseAuthSession: vi.fn(() => ({
    access: vi.fn(),
    refresh: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock('firebase/app', () => ({
  getApps: mocks.getApps,
  initializeApp: mocks.initializeApp,
}));
vi.mock('firebase/auth', () => ({ getAuth: mocks.getAuth }));
vi.mock('firebase/firestore', () => ({ getFirestore: mocks.getFirestore }));
vi.mock('@tankos/authn-firebase', () => ({
  createFirebaseAuthSession: mocks.createFirebaseAuthSession,
}));

describe('firebase.production', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.getApps.mockReturnValue([]);
    mocks.initializeApp.mockClear();
    mocks.getAuth.mockClear();
    mocks.getFirestore.mockClear();
    mocks.createFirebaseAuthSession.mockClear();
  });

  it('initializes the production Firebase adapters without any emulator setup', async () => {
    const firebase = await import('./firebase.production');

    expect(mocks.initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'tankos',
        appId: '1:769994254528:web:b5d309091934dcffca2525',
      }),
      'tankos-production',
    );
    expect(mocks.createFirebaseAuthSession).toHaveBeenCalledWith({
      auth: expect.anything(),
      email: '',
      password: '',
      roles: [],
      autoSignIn: false,
    });
    expect(mocks.getFirestore).toHaveBeenCalledWith(expect.anything());
    expect(firebase.tankosAuthSession).toBeDefined();
  });

  it('uses a checked-in public web configuration instead of runtime emulator settings', async () => {
    const firebase = await import('./firebase.production.config');

    expect(firebase.TANKOS_FIREBASE_CONFIG.authDomain).toBe(
      'tankos.firebaseapp.com',
    );
  });
});
