import type { Auth, User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { createAccessContext, createEntityId } from '@tankos/data-access';
import type { AuthSessionPort } from '../core';

export interface FirebaseAuthSessionOptions {
  readonly auth: Auth;
  readonly email: string;
  readonly password: string;
  readonly roles: readonly string[];
}

/** Creates the local emulator session used by TankOS development. */
export function createLocalFirebaseAuthSession(auth: Auth): AuthSessionPort {
  return createFirebaseAuthSession({
    auth,
    email: 'developer@tankos.local',
    // This credential is only used against the local Auth emulator.
    // eslint-disable-next-line ai-guard/no-hardcoded-secret, sonarjs/no-hardcoded-passwords
    password: 'tankos-local-dev',
    roles: ['keeper'],
  });
}

export function createFirebaseAuthSession(
  options: FirebaseAuthSessionOptions,
): AuthSessionPort {
  return {
    access: async () => {
      const user = await ensureFirebaseUser(options);
      return createAccessContext({
        principalId: createEntityId(user.uid),
        roles: options.roles,
      });
    },
  };
}

async function ensureFirebaseUser(
  options: FirebaseAuthSessionOptions,
): Promise<User> {
  if (options.auth.currentUser) return options.auth.currentUser;
  try {
    return (
      await signInWithEmailAndPassword(
        options.auth,
        options.email,
        options.password,
      )
    ).user;
  } catch (error) {
    if (!isMissingUser(error)) throw error;
    return (
      await createUserWithEmailAndPassword(
        options.auth,
        options.email,
        options.password,
      )
    ).user;
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
