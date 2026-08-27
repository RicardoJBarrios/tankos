import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import {
  AuthRequiredError,
  provideAuthSession,
  type AuthSessionPort,
} from '@tankos/authn';
import { describe, expect, it, vi } from 'vitest';
import {
  createAuthorizationGuard,
  requireAnyRole,
  type AuthorizationRoutePolicy,
} from './authorization-guard';
import type {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';

const route = {} as ActivatedRouteSnapshot;
const state = { url: '/units' } as RouterStateSnapshot;

function createSession(access: AuthSessionPort['access']): AuthSessionPort {
  return {
    access,
    signIn: vi.fn(),
    signOut: vi.fn(),
    refresh: vi.fn(),
  };
}

async function runGuard(
  session: AuthSessionPort,
  policy: AuthorizationRoutePolicy,
) {
  TestBed.configureTestingModule({
    providers: [provideAuthSession(session), provideRouter([])],
  });
  const guard = createAuthorizationGuard({ policy });
  return TestBed.runInInjectionContext(() => guard(route, state));
}

describe('requireAnyRole', () => {
  it('allows a context containing one of the required roles', () => {
    expect(
      requireAnyRole('keeper', 'admin')(
        {
          principalId: 'user-1',
          roles: ['admin'],
        },
        route,
        state,
      ),
    ).toBe(true);
  });

  it('denies a context without a required role', () => {
    expect(
      requireAnyRole('keeper')(
        { principalId: 'user-1', roles: ['guest'] },
        route,
        state,
      ),
    ).toBe(false);
  });
});

describe('createAuthorizationGuard', () => {
  it('allows a policy that returns true and receives the route context', async () => {
    const policy = vi.fn(() => true);
    const result = await runGuard(
      createSession(() =>
        Promise.resolve({ principalId: 'user-1', roles: ['keeper'] }),
      ),
      policy,
    );

    expect(result).toBe(true);
    expect(policy).toHaveBeenCalledOnce();
  });

  it('redirects a denied policy to forbidden', async () => {
    const result = await runGuard(
      createSession(() =>
        Promise.resolve({ principalId: 'user-1', roles: ['guest'] }),
      ),
      () => Promise.resolve(false),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/forbidden?returnUrl=%2Funits',
    );
  });

  it('redirects an unauthenticated session to login', async () => {
    const result = await runGuard(
      createSession(() => Promise.reject(new AuthRequiredError())),
      () => true,
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/login?returnUrl=%2Funits',
    );
  });

  it('propagates unexpected errors', async () => {
    const error = new Error('policy unavailable');

    await expect(
      runGuard(
        createSession(() => Promise.reject(error)),
        () => true,
      ),
    ).rejects.toBe(error);
  });
});
