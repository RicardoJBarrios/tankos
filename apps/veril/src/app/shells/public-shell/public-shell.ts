import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { PUBLIC_SHELL_PROVIDERS } from './public-shell.providers';

@Component({
  selector: 'veril-public-shell',
  imports: [MatButtonModule, MatToolbarModule, RouterLink, RouterOutlet],
  templateUrl: './public-shell.html',
  styleUrl: './public-shell.css',
  providers: PUBLIC_SHELL_PROVIDERS,
})
export class PublicShell {}
