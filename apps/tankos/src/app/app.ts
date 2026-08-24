import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: 'tankos-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = 'TankOS';
}
