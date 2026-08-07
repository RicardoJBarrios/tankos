import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ActiveAquariumContext } from '../../aquariums/application/active-aquarium-context';

@Component({
  selector: 'veril-private-shell',
  imports: [MatToolbarModule, RouterLink, RouterOutlet],
  providers: [ActiveAquariumContext],
  templateUrl: './private-shell.html',
  styleUrl: './private-shell.css',
})
export class PrivateShell {}
