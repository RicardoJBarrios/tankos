import type { Auth } from 'firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { AuthSessionPort } from '@tankos/authn';
import {
  isFirebaseEmailAlreadyInUse,
  isMissingFirebaseUser,
} from './firebase-auth-errors';
import { requireFirebasePasswordCredentials } from './firebase-auth-credentials';
import {
  createFirebaseAuthSession,
  type FirebaseAuthSessionOptions,
} from './firebase-auth-session';

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

async function ensureLocalRoleClaim(auth: Auth): Promise<void> {
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
