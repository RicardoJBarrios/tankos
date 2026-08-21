/** Stable identifier shared by persisted records and batch scopes. */
export type EntityId = string & { readonly __entityId: unique symbol };

/** Creates a validated entity identifier. */
export function createEntityId(value: string): EntityId {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('Entity id must be a non-empty string');
  }

  return value as EntityId;
}
