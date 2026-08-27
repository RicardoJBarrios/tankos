import type { Auth } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthRequiredError } from '@tankos/authn';
import { createFirebaseAuthSession } from './firebase-auth-session';
import { createLocalFirebaseAuthSession } from './firebase-local-auth-session';

const firebaseAuthMocks = vi.hoisted(() => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: firebaseAuthMocks.signInWithEmailAndPassword,
  createUserWithEmailAndPassword:
    firebaseAuthMocks.createUserWithEmailAndPassword,
  signOut: firebaseAuthMocks.signOut,
}));

const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } =
  firebaseAuthMocks;

describe('Firebase auth session', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('uses the current Firebase user', async () => {
    const authStateReady = vi.fn().mockResolvedValue(undefined);
    const session = createFirebaseAuthSession({
      auth: {
        authStateReady,
        currentUser: { uid: 'current-user' },
      } as Auth,
      email: 'keeper@example.test',
      password: 'password',
      roles: ['keeper'],
    });

    const access = await session.access();

    expect(access.principalId).toBe('current-user');
    expect(access.roles).toEqual(['keeper']);
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();

    await expect(session.refresh()).resolves.toMatchObject({
      principalId: 'current-user',
    });
    expect(authStateReady).toHaveBeenCalledTimes(2);
  });

  it('resolves roles from Firebase custom claims', async () => {
    const session = createFirebaseAuthSession({
      auth: {
        currentUser: {
          uid: 'claims-user',
          displayName: 'Claims User',
          getIdTokenResult: vi.fn().mockResolvedValue({
            claims: { roles: ['admin', 'keeper'] },
          }),
        },
      } as Auth,
      email: 'keeper@example.test',
      password: 'password',
      roles: ['fallback'],
    });

    await expect(session.access()).resolves.toMatchObject({
      principalId: 'claims-user',
      principalName: 'Claims User',
      roles: ['admin', 'keeper'],
    });
  });

  it('refreshes the Firebase token and resolves a singular role claim', async () => {
    const getIdToken = vi.fn().mockResolvedValue('refreshed-token');
    const getIdTokenResult = vi.fn().mockResolvedValue({
      claims: { roles: [123], role: 'editor' },
    });
    const session = createFirebaseAuthSession({
      auth: {
        currentUser: {
          uid: 'refresh-user',
          getIdToken,
          getIdTokenResult,
        },
      } as Auth,
      email: 'keeper@example.test',
      password: 'password',
      roles: ['fallback'],
    });

    await expect(session.refresh()).resolves.toMatchObject({
      principalId: 'refresh-user',
      roles: ['editor'],
    });
    expect(getIdToken).toHaveBeenCalledWith(true);
    expect(getIdTokenResult).toHaveBeenCalledOnce();
  });

  it('falls back when Firebase returns an empty roles claim', async () => {
    const session = createFirebaseAuthSession({
      auth: {
        currentUser: {
          uid: 'fallback-user',
          getIdTokenResult: vi
            .fn()
            .mockResolvedValue({ claims: { roles: [] } }),
        },
      } as Auth,
      email: 'keeper@example.test',
      password: 'password',
      roles: ['fallback'],
    });

    await expect(session.access()).resolves.toMatchObject({
      principalId: 'fallback-user',
      roles: ['fallback'],
    });
  });

  it('signs in an existing Firebase user', async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'signed-in' },
    });
    const session = createFirebaseAuthSession({
      auth: { currentUser: null } as Auth,
      email: 'keeper@example.test',
      password: 'password',
      roles: ['keeper'],
    });

    await expect(session.access()).resolves.toMatchObject({
      principalId: 'signed-in',
    });
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('creates the local user when Firebase reports it missing', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/user-not-found',
    });
    createUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'created-user' },
    });
    const session = createLocalFirebaseAuthSession({
      currentUser: null,
    } as Auth);

    await expect(session.access()).resolves.toMatchObject({
      principalId: 'created-user',
      roles: ['keeper'],
    });
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'developer@tankos.local',
      'tankos-local-dev',
    );
  });

  it.each(['auth/invalid-credential', 'auth/invalid-login-credentials'])(
    'creates the local user for the current emulator missing-user code %s',
    async (code) => {
      signInWithEmailAndPassword.mockRejectedValueOnce({ code });
      createUserWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: 'created-user-with-new-code' },
      });
      const session = createLocalFirebaseAuthSession({
        currentUser: null,
      } as Auth);

      await expect(session.access()).resolves.toMatchObject({
        principalId: 'created-user-with-new-code',
      });
    },
  );

  it('preserves an invalid credential error when the local account already exists', async () => {
    const signInError = { code: 'auth/invalid-credential' };
    signInWithEmailAndPassword.mockRejectedValueOnce(signInError);
    createUserWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/email-already-in-use',
    });
    const session = createLocalFirebaseAuthSession({
      currentUser: null,
    } as Auth);

    await expect(
      session.signIn({
        email: 'developer@tankos.local',
        password: 'wrong-password',
      }),
    ).rejects.toBe(signInError);
  });

  it('propagates an unexpected local account creation error', async () => {
    const creationError = { code: 'auth/operation-not-allowed' };
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/invalid-credential',
    });
    createUserWithEmailAndPassword.mockRejectedValueOnce(creationError);
    const session = createLocalFirebaseAuthSession({
      currentUser: null,
    } as Auth);

    await expect(
      session.signIn({
        email: 'developer@tankos.local',
        password: 'tankos-local-dev',
      }),
    ).rejects.toBe(creationError);
  });

  it('retries automatic local sign-in after a concurrent account creation', async () => {
    signInWithEmailAndPassword
      .mockRejectedValueOnce({ code: 'auth/invalid-credential' })
      .mockResolvedValueOnce({ user: { uid: 'concurrent-user' } });
    createUserWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/email-already-in-use',
    });
    const session = createFirebaseAuthSession({
      auth: { currentUser: null } as Auth,
      email: 'developer@tankos.local',
      password: 'tankos-local-dev',
      roles: ['keeper'],
    });

    await expect(session.access()).resolves.toMatchObject({
      principalId: 'concurrent-user',
    });
  });

  it('propagates an unexpected automatic local account creation error', async () => {
    const creationError = { code: 'auth/operation-not-allowed' };
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/invalid-credential',
    });
    createUserWithEmailAndPassword.mockRejectedValueOnce(creationError);
    const session = createFirebaseAuthSession({
      auth: { currentUser: null } as Auth,
      email: 'developer@tankos.local',
      password: 'tankos-local-dev',
      roles: ['keeper'],
    });

    await expect(session.access()).rejects.toBe(creationError);
  });

  it('synchronizes the local keeper claim before reading access', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const getIdToken = vi.fn().mockResolvedValue('token');
    const auth = {
      currentUser: {
        uid: 'local-keeper',
        email: 'developer@tankos.local',
        getIdToken,
        getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
      },
    } as Auth;
    const session = createLocalFirebaseAuthSession(auth, {
      autoSignIn: false,
    });

    await expect(session.access()).resolves.toMatchObject({
      principalId: 'local-keeper',
      roles: ['keeper'],
    });
    expect(getIdToken).toHaveBeenCalledWith(true);
    const authWithoutTokenRefresh = {
      currentUser: {
        uid: 'local-keeper-without-refresh',
        getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
      },
    } as Auth;
    const sessionWithoutTokenRefresh = createLocalFirebaseAuthSession(
      authWithoutTokenRefresh,
      { autoSignIn: false },
    );
    await expect(session.refresh()).resolves.toMatchObject({
      principalId: 'local-keeper',
      roles: ['keeper'],
    });
    await expect(sessionWithoutTokenRefresh.refresh()).resolves.toMatchObject({
      principalId: 'local-keeper-without-refresh',
      roles: ['keeper'],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/projects/demo-tankos/accounts:update'),
      expect.objectContaining({
        method: 'POST',
        // Vitest's asymmetric matcher is intentionally untyped here.
        headers: expect.objectContaining({ Authorization: 'Bearer owner' }),
      }),
    );
    vi.unstubAllGlobals();
  });

  it('synchronizes the local admin claim for the emulator admin account', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const auth = {
      currentUser: {
        uid: 'local-admin',
        email: 'admin@tankos.local',
        getIdTokenResult: vi
          .fn()
          .mockResolvedValue({ claims: { roles: ['admin'] } }),
      },
    } as Auth;
    const session = createLocalFirebaseAuthSession(auth, {
      autoSignIn: false,
    });

    await expect(session.access()).resolves.toMatchObject({
      principalId: 'local-admin',
      roles: ['admin'],
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          localId: 'local-admin',
          customAttributes: JSON.stringify({ roles: ['admin'] }),
        }),
      }),
    );
    vi.unstubAllGlobals();
  });

  it('synchronizes the local guest claim for the emulator guest account', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const auth = {
      currentUser: {
        uid: 'local-guest',
        email: 'guest@tankos.local',
        getIdTokenResult: vi
          .fn()
          .mockResolvedValue({ claims: { roles: ['guest'] } }),
      },
    } as Auth;
    const session = createLocalFirebaseAuthSession(auth, {
      autoSignIn: false,
    });

    await expect(session.access()).resolves.toMatchObject({
      principalId: 'local-guest',
      roles: ['guest'],
    });
    vi.unstubAllGlobals();
  });

  it('reports a local claim synchronization failure', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const auth = {
      currentUser: { uid: 'local-keeper' },
    } as Auth;
    const session = createLocalFirebaseAuthSession(auth, {
      autoSignIn: false,
    });

    await expect(session.access()).rejects.toThrow(
      'Unable to configure the local Firebase Auth role claim',
    );
    vi.unstubAllGlobals();
  });

  it('propagates authentication failures unrelated to a missing user', async () => {
    const failure = new Error('offline');
    signInWithEmailAndPassword.mockRejectedValueOnce(failure);
    const session = createFirebaseAuthSession({
      auth: { currentUser: null } as Auth,
      email: 'keeper@example.test',
      password: 'password',
      roles: ['keeper'],
    });

    await expect(session.access()).rejects.toBe(failure);
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('supports explicit sign-in and sign-out', async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'signed-in' },
    });
    const auth = {} as Auth;
    const session = createFirebaseAuthSession({
      auth,
      email: 'keeper@example.test',
      password: 'password',
      roles: ['keeper'],
    });

    await session.signIn({ email: 'user@example.test', password: 'secret' });
    await session.signOut();

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      'user@example.test',
      'secret',
    );
    expect(signOut).toHaveBeenCalledWith(auth);
  });

  it('rejects credentials that are not suitable for Firebase password auth', async () => {
    const session = createFirebaseAuthSession({
      auth: {} as Auth,
      email: 'keeper@example.test',
      password: 'password',
      roles: ['keeper'],
    });

    await expect(session.signIn({ provider: 'future-oauth' })).rejects.toThrow(
      'Firebase password authentication requires email and password',
    );
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('creates a local user when explicit sign-in targets a new emulator user', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/user-not-found',
    });
    createUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'created-from-login' },
    });
    const auth = {} as Auth;
    const session = createLocalFirebaseAuthSession(auth, {
      autoSignIn: false,
    });

    await session.signIn({ email: 'new@example.test', password: 'secret' });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      'new@example.test',
      'secret',
    );
  });

  it('propagates local sign-in failures other than a missing user', async () => {
    const failure = new Error('offline');
    signInWithEmailAndPassword.mockRejectedValueOnce(failure);
    const session = createLocalFirebaseAuthSession({} as Auth, {
      autoSignIn: false,
    });

    await expect(
      session.signIn({ email: 'keeper@example.test', password: 'secret' }),
    ).rejects.toBe(failure);
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('requires explicit sign-in when automatic sign-in is disabled', async () => {
    const session = createFirebaseAuthSession({
      auth: { currentUser: null } as Auth,
      email: 'keeper@example.test',
      password: 'password',
      roles: ['keeper'],
      autoSignIn: false,
    });

    await expect(session.access()).rejects.toBeInstanceOf(AuthRequiredError);
  });
});
