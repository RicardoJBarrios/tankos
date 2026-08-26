import type { AccessContext } from '@tankos/data-access';

/** Authenticated access resolved by the active authentication adapter. */
export interface AuthSessionPort {
  readonly access: () => Promise<AccessContext>;
}
