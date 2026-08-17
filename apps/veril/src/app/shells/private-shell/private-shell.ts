import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RestoreActiveAquarium } from '../../aquarium-management/application/restore-active-aquarium';
import { PRIVATE_SHELL_PROVIDERS } from './private-shell.providers';

@Component({
  selector: 'veril-private-shell',
  imports: [
    MatButtonModule,
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

  ngOnInit(): void {
    // The persisted id is only an untrusted hint. The restore use case
    // validates ownership asynchronously while the child route can render
    // immediately with the hydrated context.
    void this.restoreActiveAquarium.execute();
  }
}
