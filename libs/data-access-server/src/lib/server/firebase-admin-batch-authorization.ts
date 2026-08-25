import {
  DataAccessError,
  type EntityId,
  type BatchAuthorizationPort,
} from '@tankos/data-access';

function authorizationFailure(error: unknown): DataAccessError {
  if (error instanceof DataAccessError) return error;
  const transient = isTransientCode(readProviderCode(error));
  return new DataAccessError(
    transient ? 'transient' : 'forbidden',
    authorizationMessage(transient),
    { retryable: transient },
  );
}

function readProviderCode(error: unknown): string {
  if (!isProviderError(error)) return '';
  return String(error.code);
}

function isProviderError(error: unknown): error is { readonly code: unknown } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function isTransientCode(code: string): boolean {
  return ['internal', 'unavailable', 'network', 'deadline'].some((part) =>
    code.includes(part),
  );
}

function authorizationMessage(transient: boolean): string {
  if (transient) {
    return 'Firebase authorization provider is temporarily unavailable';
  }
  return 'The Firebase principal is not authorized';
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
    async authorize(
      _batchId: EntityId,
      callerPrincipalId: EntityId,
      submittedPrincipalId: EntityId,
    ): Promise<void> {
      let user;
      try {
        user = await options.auth.getUser(callerPrincipalId);
      } catch (error) {
        throw authorizationFailure(error);
      }
      const claims = user.customClaims?.[rolesClaim];
      const roles = Array.isArray(claims) ? claims : [];
      if (
        !isAuthorizedPrincipal(
          user.uid,
          callerPrincipalId,
          submittedPrincipalId,
          roles,
          requiredRole,
        )
      ) {
        throw new DataAccessError(
          'forbidden',
          'The Firebase principal is not authorized',
        );
      }
    },
  };
}

function isAuthorizedPrincipal(
  userId: string,
  callerPrincipalId: EntityId,
  submittedPrincipalId: EntityId,
  roles: unknown[],
  requiredRole: string,
): boolean {
  return (
    userId === callerPrincipalId &&
    callerPrincipalId === submittedPrincipalId &&
    roles.includes(requiredRole)
  );
}
