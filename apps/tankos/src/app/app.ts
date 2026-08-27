import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AUTH_SESSION } from '@tankos/authn';
import { FeedbackMaterialOutletComponent } from '@tankos/feedback-ui';

@Component({
  imports: [RouterModule, MatToolbarModule, FeedbackMaterialOutletComponent],
  selector: 'tankos-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly #authSession = inject(AUTH_SESSION, { optional: true });
  readonly #router = inject(Router);

  protected readonly title = 'TankOS';
  protected readonly loggingOut = signal(false);

  protected async logout(): Promise<void> {
    if (!this.#authSession) return;

    this.loggingOut.set(true);
    try {
      await this.#authSession.signOut();
      await this.#router.navigate(['/login']);
    } finally {
      this.loggingOut.set(false);
    }
  }
}
