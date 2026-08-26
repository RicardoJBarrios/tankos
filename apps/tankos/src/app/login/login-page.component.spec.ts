import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { AUTH_SESSION, type AuthSessionPort } from '@tankos/authn';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let session: {
    signIn: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  function input(testId: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(
      `[data-testid="${testId}"]`,
    ) as HTMLInputElement;
  }

  function submit(): void {
    (fixture.componentInstance as unknown as { submit: () => void }).submit();
  }

  function fillCredentials(email: string, password: string): void {
    input('login-email').value = email;
    input('login-email').dispatchEvent(new Event('input'));
    input('login-password').value = password;
    input('login-password').dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  async function render(returnUrl?: string): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AUTH_SESSION,
          useValue: session as Pick<AuthSessionPort, 'signIn' | 'signOut'>,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(
                returnUrl === undefined ? {} : { returnUrl },
              ),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  beforeEach(() => {
    session = {
      signIn: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('rejects an incomplete form without attempting authentication', async () => {
    await render();

    submit();
    await fixture.whenStable();

    expect(session.signIn).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('mat-error')).not.toBeNull();
  });

  it('signs in and navigates to a safe requested path', async () => {
    await render('/units');
    const navigateByUrl = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);

    fillCredentials('keeper@example.test', 'secret');
    submit();
    await fixture.whenStable();

    expect(session.signIn).toHaveBeenCalledWith({
      email: 'keeper@example.test',
      password: 'secret',
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/units');
  });

  it('falls back to the root for an unsafe or missing requested path', async () => {
    await render('https://attacker.example');
    const navigateByUrl = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);

    fillCredentials('keeper@example.test', 'secret');
    submit();
    await fixture.whenStable();

    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('shows an authentication error and allows retrying', async () => {
    const failure = new Error('invalid credentials');
    session.signIn.mockRejectedValueOnce(failure);
    await render();

    fillCredentials('keeper@example.test', 'wrong');
    submit();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[role="alert"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="login-submit"]')
        .disabled,
    ).toBe(false);
  });
});
