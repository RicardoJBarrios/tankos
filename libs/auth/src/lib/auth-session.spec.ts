import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import {
  authGuard,
  provideAuthSession,
  type AuthSessionPort,
} from './composition/auth-session';

describe('authGuard', () => {
  it('allows navigation when the session resolves', async () => {
    const session: AuthSessionPort = {
      access: vi.fn(() =>
        Promise.resolve({ principalId: 'keeper', roles: ['keeper'] }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [provideAuthSession(session)],
    });

    await expect(
      TestBed.runInInjectionContext(() => authGuard()),
    ).resolves.toBe(true);
  });

  it('blocks navigation when the session cannot be resolved', async () => {
    const session: AuthSessionPort = {
      access: vi.fn(() => Promise.reject(new Error('signed out'))),
    };
    TestBed.configureTestingModule({
      providers: [provideAuthSession(session)],
    });

    await expect(
      TestBed.runInInjectionContext(() => authGuard()),
    ).resolves.toBe(false);
  });
});
