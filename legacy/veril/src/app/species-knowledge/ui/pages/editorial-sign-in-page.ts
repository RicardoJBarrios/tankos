import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AUTHENTICATION_SESSION } from '../../../shared/ui/providers';

@Component({
  selector: 'veril-editorial-sign-in-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: './editorial-sign-in-page.html',
  styleUrl: './editorial-sign-in-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorialSignInPage {
  private readonly authentication = inject(AUTHENTICATION_SESSION);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly email = signal('');
  readonly password = signal('');
  readonly state = signal<'ready' | 'saving' | 'success' | 'failure'>('ready');
  readonly errorMessage = signal('');

  constructor() {
    afterNextRender(() => void this.restoreExistingSession());
  }

  async submit(): Promise<void> {
    this.state.set('saving');
    try {
      await this.authentication.signInWithPassword(
        this.email(),
        this.password(),
      );
      const snapshot = await this.authentication.getSnapshot({
        forceRefresh: true,
      });
      if (!this.canContinue(snapshot)) {
        await this.authentication.signOut();
        throw new Error('La cuenta no tiene permisos para continuar.');
      }
      this.state.set('success');
      await this.router.navigateByUrl(this.returnUrl());
    } catch {
      this.errorMessage.set('No se ha podido iniciar la sesión.');
      this.state.set('failure');
    }
  }

  private async restoreExistingSession(): Promise<void> {
    try {
      if (this.isAccountSwitchRequested()) {
        await this.authentication.signOut().catch(() => undefined);
        this.state.set('ready');
        return;
      }
      const snapshot = await this.authentication.getSnapshot();
      if (snapshot.isAuthenticated && this.canContinue(snapshot)) {
        this.state.set('success');
        await this.router.navigateByUrl(this.returnUrl());
      } else if (snapshot.isAuthenticated) {
        await this.authentication.signOut().catch(() => undefined);
        this.state.set('ready');
      }
    } catch {
      // The sign-in form remains available when there is no valid session.
    }
  }

  private isAccountSwitchRequested(): boolean {
    return this.route.snapshot.queryParamMap.get('switchAccount') === 'true';
  }

  private returnUrl(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    return requested?.startsWith('/') && !requested.startsWith('//')
      ? requested
      : '/app/aquariums';
  }

  private canContinue(snapshot: {
    readonly isAuthenticated: boolean;
    readonly isKeeper: boolean;
    readonly isEditorialAdmin: boolean;
  }): boolean {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    if (requested?.startsWith('/access/')) return snapshot.isAuthenticated;
    if (requested?.startsWith('/editorial/')) return snapshot.isEditorialAdmin;
    return snapshot.isKeeper;
  }
}
