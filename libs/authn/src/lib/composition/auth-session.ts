import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import {
  Router,
  type ActivatedRouteSnapshot,
  type CanActivateFn,
  type RouterStateSnapshot,
} from '@angular/router';
import type { AuthSessionPort } from '../core';

export type { AuthSessionPort } from '../core';

export const AUTH_SESSION = new InjectionToken<AuthSessionPort>('AUTH_SESSION');

/** Allows navigation only when the configured authentication session is valid. */
export function authGuard(
  _route?: ActivatedRouteSnapshot,
  state?: RouterStateSnapshot,
): ReturnType<CanActivateFn> {
  const session = inject(AUTH_SESSION);
  const router = inject(Router);
  return session
    .access()
    .then(() => true)
    .catch(() =>
      router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state?.url ?? router.url },
      }),
    );
}

export function provideAuthSession(
  session: AuthSessionPort,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AUTH_SESSION, useValue: session },
  ]);
}
