import {
  ChangeDetectionStrategy,
  Component,
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
  readonly accessType = this.route.snapshot.data['accessType'] as
    'private' | 'editorial' | undefined;
  readonly email = signal('');
  readonly password = signal('');
  readonly state = signal<'ready' | 'saving' | 'success' | 'failure'>('ready');
  readonly errorMessage = signal('');

  async submit(): Promise<void> {
    this.state.set('saving');
    try {
      await this.authentication.signInWithPassword(
        this.email(),
        this.password(),
      );
      if (!(await this.authentication.isKeeper())) {
        await this.authentication.signOut();
        throw new Error('La cuenta no tiene el rol keeper.');
      }
      this.state.set('success');
      const redirectTo = this.route.snapshot.data['redirectTo'] as
        string | undefined;
      if (redirectTo) await this.router.navigateByUrl(redirectTo);
    } catch {
      this.errorMessage.set('No se ha podido iniciar la sesión.');
      this.state.set('failure');
    }
  }
}
