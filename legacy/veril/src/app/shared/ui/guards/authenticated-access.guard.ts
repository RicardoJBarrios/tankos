import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTHENTICATION_SESSION } from '../providers';

export const authenticatedAccessGuard: CanActivateFn = async (route) => {
  const authentication = inject(AUTHENTICATION_SESSION);
  const router = inject(Router);
  try {
    if ((await authentication.getSnapshot()).isAuthenticated) return true;
  } catch {
    // Invalid or stale sessions are treated as unauthenticated.
  }
  return router.createUrlTree(['/sign-in'], {
    queryParams: {
      returnUrl: route.url.map((segment) => segment.path).join('/'),
    },
  });
};
