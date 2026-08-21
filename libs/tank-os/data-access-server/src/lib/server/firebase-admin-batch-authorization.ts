import {
  DataAccessError,
  type AccessContext,
  type EntityId,
  type BatchAuthorizationPort,
} from '@tank-os/data-access';

function authorizationFailure(error: unknown): DataAccessError {
  if (error instanceof DataAccessError) return error;
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { readonly code: unknown }).code)
      : '';
  return new DataAccessError(
    code.includes('internal') ||
      code.includes('unavailable') ||
      code.includes('network') ||
      code.includes('deadline')
      ? 'transient'
      : 'forbidden',
    code.includes('internal') || code.includes('unavailable')
      ? 'Firebase authorization provider is temporarily unavailable'
      : 'The Firebase principal is not authorized',
    { retryable: code.includes('internal') || code.includes('unavailable') },
  );
}

/** Minimal Firebase Admin Auth surface required by the server adapter. */
export interface FirebaseAdminAuthPort {
  /** Loads the authoritative Firebase user and custom claims. */
  getUser(uid: string): Promise<{
    readonly uid: string;
    readonly customClaims?: Record<string, unknown>;
  }>;
}

/** Configuration for the trusted batch authorization adapter. */
export interface FirebaseAdminBatchAuthorizationOptions {
  /** Firebase Admin Auth instance, normally `getAuth()`. */
  readonly auth: FirebaseAdminAuthPort;
  /** Claim containing the trusted worker roles. Defaults to `roles`. */
  readonly rolesClaim?: string;
  /** Role accepted for administrative batch execution. Defaults to `worker`. */
  readonly requiredRole?: string;
}

/**
 * Creates the server-side authorization boundary for asynchronous batches.
 *
 * The browser-provided `AccessContext` is treated as a request hint only. The
 * adapter reloads the user from Firebase Admin Auth and authorizes the role
 * from authoritative custom claims before a worker executes writes.
 */
export function createFirebaseAdminBatchAuthorization(
  options: FirebaseAdminBatchAuthorizationOptions,
): BatchAuthorizationPort {
  const rolesClaim = options.rolesClaim ?? 'roles';
  const requiredRole = options.requiredRole ?? 'worker';

  return {
    async authorize(_batchId: EntityId, access: AccessContext): Promise<void> {
      let user;
      try {
        user = await options.auth.getUser(access.principalId);
      } catch (error) {
        throw authorizationFailure(error);
      }
      const claims = user.customClaims?.[rolesClaim];
      const roles = Array.isArray(claims) ? claims : [];
      if (user.uid !== access.principalId || !roles.includes(requiredRole)) {
        throw new DataAccessError(
          'forbidden',
          'The Firebase principal is not authorized',
        );
      }
    },
  };
}
