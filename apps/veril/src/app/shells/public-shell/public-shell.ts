import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'veril-public-shell',
  imports: [MatToolbarModule, RouterLink, RouterOutlet],
  templateUrl: './public-shell.html',
  styleUrl: './public-shell.css',
})
export class PublicShell {}
