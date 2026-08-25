import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { SpeciesProfile } from '../../application/ports';
import { SPECIES_PROFILE_REVISION_READER } from '../providers';
import { markdownToHtml } from '../markdown-to-html';

@Component({
  selector: 'veril-species-profile-history-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
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
  readonly leftRevisionId = signal('');
  readonly rightRevisionId = signal('');
  readonly comparison = computed(() => {
    const left = this.revisionById(this.leftRevisionId());
    const right = this.revisionById(this.rightRevisionId());
    return left && right ? { left, right } : null;
  });

  markdownToHtml(markdown: string): string {
    return markdownToHtml(markdown);
  }

  formatPublishedAt(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  revisionById(id: string): SpeciesProfile | undefined {
    return this.revisions().find((revision) => revision.revision.id === id);
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
      this.leftRevisionId.set(revisions[0]?.revision.id ?? '');
      this.rightRevisionId.set(revisions[1]?.revision.id ?? '');
      this.state.set(revisions.length > 0 ? 'success' : 'empty');
    } catch {
      this.state.set('failure');
    }
  }
}
