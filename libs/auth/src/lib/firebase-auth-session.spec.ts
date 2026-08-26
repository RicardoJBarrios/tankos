import type { Auth } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createFirebaseAuthSession,
  createLocalFirebaseAuthSession,
} from './adapters/firebase-auth-session';

const firebaseAuthMocks = vi.hoisted(() => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: firebaseAuthMocks.signInWithEmailAndPassword,
  createUserWithEmailAndPassword:
    firebaseAuthMocks.createUserWithEmailAndPassword,
}));

const { signInWithEmailAndPassword, createUserWithEmailAndPassword } =
  firebaseAuthMocks;

describe('Firebase auth session', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('uses the current Firebase user', async () => {
    const session = createFirebaseAuthSession({
      auth: { currentUser: { uid: 'current-user' } } as Auth,
      email: 'keeper@example.test',
      password: 'password',
      roles: ['keeper'],
    });

    const access = await session.access();

    expect(access.principalId).toBe('current-user');
    expect(access.roles).toEqual(['keeper']);
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
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
});
