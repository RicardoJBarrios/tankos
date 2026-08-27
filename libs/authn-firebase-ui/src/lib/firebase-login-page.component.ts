import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { AUTH_SESSION, type AuthCredentials } from '@tankos/authn';

@Component({
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './firebase-login-page.component.html',
  styleUrl: './firebase-login-page.component.css',
})
export class FirebaseLoginPageComponent {
  protected readonly email = new FormControl('', {
    nonNullable: true,
    validators: [
      (control) => Validators.required(control),
      (control) => Validators.email(control),
    ],
  });
  protected readonly password = new FormControl('', {
    nonNullable: true,
    validators: [(control) => Validators.required(control)],
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<unknown>(undefined);

  readonly #session = inject(AUTH_SESSION);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  protected submit(): void {
    if (this.email.invalid || this.password.invalid) {
      this.email.markAsTouched();
      this.password.markAsTouched();
      return;
    }

    this.pending.set(true);
    this.error.set(undefined);
    const credentials: AuthCredentials = {
      email: this.email.value.trim(),
      password: this.password.value,
    };
    void this.#signIn(credentials);
  }

  async #signIn(credentials: AuthCredentials): Promise<void> {
    try {
      await this.#session.signIn(credentials);
      await this.#router.navigateByUrl(this.returnUrl());
    } catch (error) {
      this.error.set(error);
      this.pending.set(false);
    }
  }

  private returnUrl(): string {
    const returnUrl = this.#route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl?.startsWith('/') ? returnUrl : '/';
  }
}
