import type { AuthCredentials } from '@tankos/authn';

export function requireFirebasePasswordCredentials(
  credentials: AuthCredentials,
): {
  readonly email: string;
  readonly password: string;
} {
  const email = credentials['email'];
  const password = credentials['password'];
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new TypeError(
      'Firebase password authentication requires email and password',
    );
  }
  return { email, password };
}
