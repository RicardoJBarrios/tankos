import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GetPublishedSpeciesProfile } from '../../application/get-published-species-profile';
import { SpeciesProfile } from '../../application/ports';
import {
  SPECIES_PROFILE_DRAFT_WRITER,
  PUBLISHED_SPECIES_PROFILE_READER,
} from '../providers';
import { SpeciesProfileDraft } from '../../domain/species-profile';

@Component({
  selector: 'veril-edit-species-profile-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: './edit-species-profile-page.html',
  styleUrl: './edit-species-profile-page.css',
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
export class EditSpeciesProfilePage implements OnInit {
  private readonly getProfile = inject(GetPublishedSpeciesProfile);
  private readonly draftWriter = inject(SPECIES_PROFILE_DRAFT_WRITER);
  private readonly route = inject(ActivatedRoute);
  readonly state = signal<'loading' | 'ready' | 'saving' | 'saved' | 'failure'>(
    'loading',
  );
  readonly profile = signal<SpeciesProfile | null>(null);
  readonly displayName = signal('');
  readonly scientificName = signal('');
  readonly description = signal('');
  readonly sectionContent = signal('');
  readonly errorMessage = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.state.set('failure');
      return;
    }
    void this.load(id);
  }

  async saveDraft(): Promise<void> {
    const current = this.profile();
    if (!current) return;
    this.state.set('saving');
    try {
      const draft: SpeciesProfileDraft = {
        speciesProfileId: current.id,
        displayName: this.displayName().trim(),
        ...(this.scientificName().trim()
          ? { scientificName: this.scientificName().trim() }
          : {}),
        description: this.description().trim(),
        sections: current.sections.map((section, index) => ({
          ...section,
          ...(index === 0 ? { content: this.sectionContent().trim() } : {}),
        })),
        sources: current.sources,
      };
      await this.draftWriter.saveDraft(draft);
      this.state.set('saved');
    } catch {
      this.errorMessage.set('No se ha podido guardar el borrador.');
      this.state.set('failure');
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const profile = await this.getProfile.execute(id);
      if (!profile) {
        this.state.set('failure');
        return;
      }
      this.profile.set(profile);
      this.displayName.set(profile.displayName);
      this.scientificName.set(profile.scientificName ?? '');
      this.description.set(profile.description);
      this.sectionContent.set(profile.sections[0]?.content ?? '');
      this.state.set('ready');
    } catch {
      this.errorMessage.set('No se ha podido cargar el perfil editorial.');
      this.state.set('failure');
    }
  }
}
