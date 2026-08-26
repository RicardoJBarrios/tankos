import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import {
  authGuard,
  provideAuthSession,
  type AuthSessionPort,
} from './composition/auth-session';
import {
  provideRouter,
  UrlTree,
  type RouterStateSnapshot,
} from '@angular/router';

describe('authGuard', () => {
  it('allows navigation when the session resolves', async () => {
    const session: AuthSessionPort = {
      access: vi.fn(() =>
        Promise.resolve({ principalId: 'keeper', roles: ['keeper'] }),
      ),
      signIn: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [provideAuthSession(session), provideRouter([])],
    });

    await expect(
      TestBed.runInInjectionContext(() => authGuard()),
    ).resolves.toBe(true);
  });

  it('blocks navigation when the session cannot be resolved', async () => {
    const session: AuthSessionPort = {
      access: vi.fn(() => Promise.reject(new Error('signed out'))),
      signIn: vi.fn(),
      signOut: vi.fn(),
      refresh: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [provideAuthSession(session), provideRouter([])],
    });

    await expect(
      TestBed.runInInjectionContext(() =>
        authGuard(undefined, { url: '/units' } as RouterStateSnapshot),
      ),
    ).resolves.toBeInstanceOf(UrlTree);

    await expect(
      TestBed.runInInjectionContext(() => authGuard()),
    ).resolves.toBeInstanceOf(UrlTree);
  });
});
