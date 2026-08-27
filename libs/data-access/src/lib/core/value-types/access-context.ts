import type { EntityId } from './entity-id';

/** Opaque role name interpreted by the host authorization policy. */
export type AccessRole = string;

/** Authenticated scope carried by every data-access command and query. */
export interface AccessContext {
  readonly principalId: EntityId;
  /** Optional presentation name; never used as an authorization key. */
  readonly principalName?: string;
  readonly roles: readonly AccessRole[];
  /** Stable idempotency key for one mutating command, when available. */
  readonly requestId?: string;
}

function assertNonEmptyString(value: unknown, message: string): void {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(message);
}

function validateRoles(roles: unknown): void {
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new TypeError('Access context must contain at least one role');
  }
  if (roles.some((role) => typeof role !== 'string' || !role.trim())) {
    throw new TypeError('Access context contains an invalid role');
  }
}

function validateOptionalString(value: unknown, message: string): void {
  if (value !== undefined) assertNonEmptyString(value, message);
}

/** Creates a validated access context at an application boundary. */
export function createAccessContext(context: AccessContext): AccessContext {
  if (!context || typeof context !== 'object') {
    throw new TypeError('Access context must be an object');
  }
  assertNonEmptyString(
    context.principalId,
    'Access principal id must be a non-empty string',
  );
  validateRoles(context.roles);
  validateOptionalString(
    context.requestId,
    'Request id must be a non-empty string',
  );
  validateOptionalString(
    context.principalName,
    'Access principal name must be a non-empty string',
  );
  return {
    ...context,
    roles: [...context.roles],
  };
}
