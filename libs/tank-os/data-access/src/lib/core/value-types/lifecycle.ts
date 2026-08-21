/** Lifecycle states shared by CRUD records. */
export type LifecycleStatus =
  'active' | 'inactive' | 'marked-for-deletion' | 'deleted';

/** Immutable lifecycle projection exposed by data-access ports. */
export interface LifecycleState {
  readonly status: LifecycleStatus;
}
