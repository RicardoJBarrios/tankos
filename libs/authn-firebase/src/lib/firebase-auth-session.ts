import type { Auth, User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { createAccessContext, createEntityId } from '@tankos/data-access';
import {
  AuthRequiredError,
  type AuthCredentials,
  type AuthSessionPort,
} from '@tankos/authn';
import { requireFirebasePasswordCredentials } from './firebase-auth-credentials';
import {
  isFirebaseEmailAlreadyInUse,
  isMissingFirebaseUser,
} from './firebase-auth-errors';

export interface FirebaseAuthSessionOptions {
  readonly auth: Auth;
  readonly email: string;
  readonly password: string;
  readonly roles: readonly string[];
  readonly autoSignIn?: boolean;
}

/** Creates the local emulator session used by TankOS development. */
export function createLocalFirebaseAuthSession(
  auth: Auth,
  options: Pick<FirebaseAuthSessionOptions, 'autoSignIn'> = {},
): AuthSessionPort {
  const session = createFirebaseAuthSession({
    auth,
    email: 'developer@tankos.local',
    // This credential is only used against the local Auth emulator.
    // eslint-disable-next-line ai-guard/no-hardcoded-secret, sonarjs/no-hardcoded-passwords
    password: 'tankos-local-dev',
    roles: ['keeper'],
    autoSignIn: options.autoSignIn ?? true,
  });

  return {
    ...session,
    access: async () => {
      await ensureLocalRoleClaim(auth);
      return session.access();
    },
    signIn: async (credentials) => {
      const passwordCredentials =
        requireFirebasePasswordCredentials(credentials);
      try {
        await session.signIn(credentials);
      } catch (error) {
        if (!isMissingFirebaseUser(error)) throw error;
        try {
          await createUserWithEmailAndPassword(
            auth,
            passwordCredentials.email,
            passwordCredentials.password,
          );
        } catch (creationError) {
          // Newer Firebase SDKs use auth/invalid-credential for both an
          // unknown user and an invalid password. If the account already
          // exists, preserve the original sign-in error instead of exposing
          // the account-creation error or masking a bad password.
          if (isFirebaseEmailAlreadyInUse(creationError)) throw error;
          throw creationError;
        }
      }
    },
    refresh: async () => {
      await ensureLocalRoleClaim(auth);
      return session.refresh();
    },
  };
}

/** Synchronizes the local-only role claim with the Auth emulator. */
async function ensureLocalRoleClaim(auth: Auth): Promise<void> {
  // Unit tests and server-side consumers do not have the emulator endpoint.
  if (typeof window === 'undefined' || !auth.currentUser) return;
  const response = await fetch(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-tankos/accounts:update',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer owner',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        localId: auth.currentUser.uid,
        customAttributes: JSON.stringify({
          roles: [localRoleForEmail(auth.currentUser.email)],
        }),
      }),
    },
  );
  if (!response.ok) {
    throw new Error('Unable to configure the local Firebase Auth role claim');
  }
  const getIdToken = (
    auth.currentUser as unknown as {
      readonly getIdToken?: (forceRefresh?: boolean) => Promise<string>;
    }
  ).getIdToken;
  if (getIdToken) await getIdToken.call(auth.currentUser, true);
}

function localRoleForEmail(email: string | null): 'keeper' | 'admin' | 'guest' {
  if (email === 'admin@tankos.local') return 'admin';
  if (email === 'guest@tankos.local') return 'guest';
  return 'keeper';
}

export function createFirebaseAuthSession(
  options: FirebaseAuthSessionOptions,
): AuthSessionPort {
  return {
    access: async () => {
      const user = await ensureFirebaseUser(options);
      return createAccessContext(
        await createAccessContextForUser(user, options),
      );
    },
    signIn: async (credentials: AuthCredentials) => {
      const passwordCredentials =
        requireFirebasePasswordCredentials(credentials);
      await signInWithEmailAndPassword(
        options.auth,
        passwordCredentials.email,
        passwordCredentials.password,
      );
    },
    signOut: () => signOut(options.auth),
    refresh: async () => {
      const user = await ensureFirebaseUser(options);
      const getIdToken = (
        user as unknown as {
          readonly getIdToken?: (forceRefresh?: boolean) => Promise<string>;
        }
      ).getIdToken;
      if (getIdToken) await getIdToken.call(user, true);
      return createAccessContext(
        await createAccessContextForUser(user, options),
      );
    },
  };
}

async function createAccessContextForUser(
  user: User,
  options: FirebaseAuthSessionOptions,
): Promise<{
  readonly principalId: ReturnType<typeof createEntityId>;
  readonly principalName: string;
  readonly roles: readonly string[];
}> {
  const getIdTokenResult = (
    user as unknown as {
      readonly getIdTokenResult?: () => Promise<{
        readonly claims: Readonly<Record<string, unknown>>;
      }>;
    }
  ).getIdTokenResult;
  const claims = getIdTokenResult
    ? (await getIdTokenResult.call(user)).claims
    : undefined;
  return {
    principalId: createEntityId(user.uid),
    principalName: user.displayName?.trim() || user.email || user.uid,
    roles: rolesFromClaims(claims, options.roles),
  };
}

function rolesFromClaims(
  claims: Readonly<Record<string, unknown>> | undefined,
  fallback: readonly string[],
): readonly string[] {
  const roles = claims?.['roles'];
  if (isNonEmptyStringArray(roles)) {
    return roles;
  }
  const role = claims?.['role'];
  return typeof role === 'string' && role.length > 0 ? [role] : fallback;
}

function isNonEmptyStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string')
  );
}

async function ensureFirebaseUser(
  options: FirebaseAuthSessionOptions,
): Promise<User> {
  const authStateReady = (
    options.auth as unknown as {
      readonly authStateReady?: () => Promise<void>;
    }
  ).authStateReady;
  if (authStateReady) await authStateReady.call(options.auth);
  if (options.auth.currentUser) return options.auth.currentUser;
  if (options.autoSignIn === false) throw new AuthRequiredError();
  try {
    return (
      await signInWithEmailAndPassword(
        options.auth,
        options.email,
        options.password,
      )
    ).user;
  } catch (error) {
    if (!isMissingFirebaseUser(error)) throw error;
    try {
      return (
        await createUserWithEmailAndPassword(
          options.auth,
          options.email,
          options.password,
        )
      ).user;
    } catch (creationError) {
      if (isFirebaseEmailAlreadyInUse(creationError)) {
        // A concurrent sign-in or another local tab may have created the
        // account between the two calls. Retry sign-in once in that case.
        return (
          await signInWithEmailAndPassword(
            options.auth,
            options.email,
            options.password,
          )
        ).user;
      }
      throw creationError;
    }
  }
}
