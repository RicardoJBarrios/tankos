/** Identifies the ownership and domain boundaries of a cached value. */
export interface CacheScope {
  /** Top-level TankOS domain, for example `units` or `measurements`. */
  readonly domain: string;
  /** Optional entity within the domain. */
  readonly entity?: string;
  /** Optional authenticated principal owning the value. */
  readonly principalId?: string;
  /** Optional Aquarium scope owning the value. */
  readonly aquariumId?: string;
}

/** Converts a scope into a stable hierarchical cache namespace. */
export function createCacheNamespace(scope: CacheScope): string {
  const values = [
    scope.domain,
    scope.entity,
    scope.principalId,
    scope.aquariumId,
  ].filter((value): value is string => value !== undefined);

  if (values.some((value) => !value.trim() || value.includes(':'))) {
    throw new TypeError(
      'Cache scope segments must be non-empty and colon-free',
    );
  }

  return ['tankos', ...values].join(':');
}
