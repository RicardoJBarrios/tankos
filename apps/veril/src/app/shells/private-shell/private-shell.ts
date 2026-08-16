import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RestoreActiveAquarium } from '../../aquarium-management/application/restore-active-aquarium';
import { PRIVATE_SHELL_PROVIDERS } from './private-shell.providers';

@Component({
  selector: 'veril-private-shell',
  imports: [
    MatButtonModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    RouterLink,
    RouterOutlet,
  ],
  providers: PRIVATE_SHELL_PROVIDERS,
  templateUrl: './private-shell.html',
  styleUrl: './private-shell.css',
})
export class PrivateShell implements OnInit {
  private readonly restoreActiveAquarium = inject(RestoreActiveAquarium);

  readonly isRestoring = signal(true);

  async ngOnInit(): Promise<void> {
    await this.restoreActiveAquarium.execute();
    this.isRestoring.set(false);
  }
}
