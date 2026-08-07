import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'veril-private-shell',
  imports: [MatToolbarModule, RouterLink, RouterOutlet],
  templateUrl: './private-shell.html',
  styleUrl: './private-shell.css',
})
export class PrivateShell {}
