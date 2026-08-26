import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import type { AuthSessionPort } from '../core';

export type { AuthSessionPort } from '../core';

export const AUTH_SESSION = new InjectionToken<AuthSessionPort>('AUTH_SESSION');

/** Allows navigation only when the configured authentication session is valid. */
export function authGuard(): ReturnType<CanActivateFn> {
  const session = inject(AUTH_SESSION);
  return session
    .access()
    .then(() => true)
    .catch(() => false);
}

export function provideAuthSession(
  session: AuthSessionPort,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AUTH_SESSION, useValue: session },
  ]);
}
