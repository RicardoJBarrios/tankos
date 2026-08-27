export function isMissingFirebaseUser(error: unknown): boolean {
  const code = firebaseErrorCode(error);
  return (
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-login-credentials'
  );
}

export function isFirebaseEmailAlreadyInUse(error: unknown): boolean {
  return firebaseErrorCode(error) === 'auth/email-already-in-use';
}

function firebaseErrorCode(error: unknown): unknown {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code
  );
}
