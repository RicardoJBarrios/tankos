/** Lifecycle states shared by CRUD records. */
export type LifecycleStatus =
  'active' | 'inactive' | 'marked-for-deletion' | 'deleted';

/** Immutable lifecycle projection exposed by data-access ports. */
export interface LifecycleState {
  readonly status: LifecycleStatus;
}

/** Validates lifecycle filters before they reach a provider query. */
export function validateLifecycleSelection(
  lifecycle: readonly LifecycleStatus[] | undefined,
): readonly LifecycleStatus[] | undefined {
  if (lifecycle === undefined) return undefined;
  if (!Array.isArray(lifecycle) || lifecycle.length === 0) {
    throw new TypeError('Lifecycle selection must not be empty');
  }
  if (new Set(lifecycle).size !== lifecycle.length) {
    throw new TypeError('Lifecycle selection must not contain duplicates');
  }
  if (lifecycle.some((status) => !['active', 'inactive', 'marked-for-deletion', 'deleted'].includes(status))) {
    throw new TypeError('Lifecycle selection contains an invalid status');
  }
  return lifecycle;
}
