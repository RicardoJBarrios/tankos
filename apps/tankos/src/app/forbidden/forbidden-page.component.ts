import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  imports: [MatButtonModule, MatCardModule, RouterLink],
  template: `
    <main class="forbidden-page" data-testid="forbidden-page">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Permission denied</mat-card-title>
          <mat-card-subtitle>
            You do not have permission to access this page.
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <a mat-flat-button routerLink="/">Back to dashboard</a>
        </mat-card-actions>
      </mat-card>
    </main>
  `,
  styles: `
    .forbidden-page {
      display: grid;
      min-height: 70vh;
      place-items: center;
      padding: 1rem;
    }

    mat-card {
      max-width: 32rem;
      width: 100%;
    }
  `,
})
export class ForbiddenPageComponent {
  protected readonly page = true;
}
