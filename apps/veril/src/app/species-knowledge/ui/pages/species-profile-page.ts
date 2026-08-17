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
import { GetPublishedSpeciesProfile } from '../../application/get-published-species-profile';
import { SpeciesProfile } from '../../application/ports';
import { PUBLISHED_SPECIES_PROFILE_READER } from '../providers';
import { markdownToHtml } from '../markdown-to-html';

@Component({
  selector: 'veril-species-profile-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './species-profile-page.html',
  styleUrl: './species-profile-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: GetPublishedSpeciesProfile,
      useFactory: () =>
        new GetPublishedSpeciesProfile(
          inject(PUBLISHED_SPECIES_PROFILE_READER),
        ),
    },
  ],
})
export class SpeciesProfilePage implements OnInit {
  private readonly getProfile = inject(GetPublishedSpeciesProfile);
  private readonly route = inject(ActivatedRoute);
  readonly state = signal<'loading' | 'success' | 'failure'>('loading');
  readonly profile = signal<SpeciesProfile | null>(null);

  markdownToHtml(markdown: string): string {
    return markdownToHtml(markdown);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.state.set('failure');
      return;
    }
    void this.load(id);
  }

  private async load(id: string): Promise<void> {
    try {
      const profile = await this.getProfile.execute(id);
      if (!profile) {
        this.state.set('failure');
        return;
      }
      this.profile.set(profile);
      this.state.set('success');
    } catch {
      this.state.set('failure');
    }
  }
}
