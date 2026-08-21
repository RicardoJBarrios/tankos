import type { EntityId } from './entity-id';

/** Opaque role name interpreted by the host authorization policy. */
export type AccessRole = string;

/** Authenticated scope carried by every data-access command and query. */
export interface AccessContext {
  readonly principalId: EntityId;
  readonly roles: readonly AccessRole[];
  readonly aquariumId?: EntityId;
  readonly requestId?: string;
}

/** Creates a validated access context at an application boundary. */
export function createAccessContext(
  context: AccessContext,
): AccessContext {
  if (!context || typeof context !== 'object') {
    throw new TypeError('Access context must be an object');
  }
  if (typeof context.principalId !== 'string' || !context.principalId.trim()) {
    throw new TypeError('Access principal id must be a non-empty string');
  }
  if (!Array.isArray(context.roles) || context.roles.length === 0) {
    throw new TypeError('Access context must contain at least one role');
  }
  if (context.roles.some((role) => typeof role !== 'string' || !role.trim())) {
    throw new TypeError('Access context contains an invalid role');
  }
  if (
    context.aquariumId !== undefined &&
    (typeof context.aquariumId !== 'string' || !context.aquariumId.trim())
  ) {
    throw new TypeError('Aquarium scope must be a non-empty string');
  }
  return {
    ...context,
    roles: [...context.roles],
  };
}
