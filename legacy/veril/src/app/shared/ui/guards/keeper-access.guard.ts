import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTHENTICATION_SESSION } from '../providers';

export const keeperAccessGuard: CanActivateFn = async () => {
  const authentication = inject(AUTHENTICATION_SESSION);
  const router = inject(Router);

  try {
    if ((await authentication.getSnapshot()).isKeeper) return true;
  } catch {
    // An invalid or stale Firebase session is treated as unauthenticated.
  }

  return router.createUrlTree(['/sign-in']);
};
