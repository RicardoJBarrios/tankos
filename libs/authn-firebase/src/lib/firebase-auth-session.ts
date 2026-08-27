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
