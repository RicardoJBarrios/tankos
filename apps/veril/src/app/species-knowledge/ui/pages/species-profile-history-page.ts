import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SpeciesProfile } from '../../application/ports';
import { SPECIES_PROFILE_REVISION_READER } from '../providers';
import { markdownToHtml } from '../markdown-to-html';

@Component({
  selector: 'veril-species-profile-history-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './species-profile-history-page.html',
  styleUrl: './species-profile-history-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeciesProfileHistoryPage implements OnInit {
  private readonly reader = inject(SPECIES_PROFILE_REVISION_READER);
  private readonly route = inject(ActivatedRoute);
  readonly state = signal<'loading' | 'success' | 'empty' | 'failure'>(
    'loading',
  );
  readonly revisions = signal<readonly SpeciesProfile[]>([]);
  readonly profileId = signal<string | null>(null);

  markdownToHtml(markdown: string): string {
    return markdownToHtml(markdown);
  }

  formatPublishedAt(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.state.set('failure');
      return;
    }
    this.profileId.set(id);
    void this.load(id);
  }

  private async load(id: string): Promise<void> {
    try {
      const revisions = await this.reader.listRevisions(
        id as SpeciesProfile['id'],
      );
      this.revisions.set(revisions);
      this.state.set(revisions.length > 0 ? 'success' : 'empty');
    } catch {
      this.state.set('failure');
    }
  }
}
