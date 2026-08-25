import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTHENTICATION_SESSION } from '../providers';

export const editorialAccessGuard: CanActivateFn = async () => {
  const authentication = inject(AUTHENTICATION_SESSION);
  const router = inject(Router);
  try {
    if ((await authentication.getSnapshot()).isEditorialAdmin) return true;
  } catch {
    // Invalid or stale sessions are treated as unauthenticated.
  }
  return router.createUrlTree(['/sign-in'], {
    queryParams: { returnUrl: '/editorial/species-knowledge' },
  });
};
