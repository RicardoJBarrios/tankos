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
import { PublishSpeciesProfileDraft } from '../../application/publish-species-profile-draft';
import { ReviewSpeciesProfileDraft } from '../../application/review-species-profile-draft';
import {
  SpeciesProfile,
  SpeciesProfileDraft,
  SpeciesProfileDraftStatus,
} from '../../application/ports';
import {
  PUBLISHED_SPECIES_PROFILE_READER,
  SPECIES_PROFILE_DRAFT_READER,
  SPECIES_PROFILE_DRAFT_WRITER,
  SPECIES_PROFILE_PUBLISHER,
  SPECIES_PROFILE_REVIEWER,
} from '../providers';

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
  private readonly draftReader = inject(SPECIES_PROFILE_DRAFT_READER);
  private readonly publishDraftUseCase = new PublishSpeciesProfileDraft(
    inject(SPECIES_PROFILE_PUBLISHER),
  );
  private readonly reviewDraftUseCase = new ReviewSpeciesProfileDraft(
    inject(SPECIES_PROFILE_REVIEWER),
  );
  private readonly route = inject(ActivatedRoute);
  readonly state = signal<
    | 'loading'
    | 'ready'
    | 'saving'
    | 'saved'
    | 'publishing'
    | 'published'
    | 'failure'
  >('loading');
  readonly profile = signal<SpeciesProfile | null>(null);
  readonly displayName = signal('');
  readonly scientificName = signal('');
  readonly description = signal('');
  readonly sectionContent = signal('');
  readonly errorMessage = signal('');
  readonly draftStatus = signal<SpeciesProfileDraftStatus>('draft');

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
      await this.draftWriter.saveDraft(this.createDraft(current));
      this.draftStatus.set('draft');
      this.state.set('saved');
    } catch {
      this.errorMessage.set('No se ha podido guardar el borrador.');
      this.state.set('failure');
    }
  }

  async publishDraft(): Promise<void> {
    const current = this.profile();
    if (!current || this.draftStatus() !== 'reviewed') return;
    this.state.set('publishing');
    try {
      await this.publishDraftUseCase.execute(this.createDraft(current));
      this.state.set('published');
    } catch {
      this.errorMessage.set('No se ha podido publicar la revisión.');
      this.state.set('failure');
    }
  }

  async reviewDraft(): Promise<void> {
    const current = this.profile();
    if (!current) return;
    try {
      await this.reviewDraftUseCase.execute(current.id);
      this.draftStatus.set('reviewed');
      this.state.set('ready');
    } catch {
      this.errorMessage.set(
        'No se ha podido marcar el borrador como revisado.',
      );
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
      const draft = await this.draftReader.getDraft(profile.id);
      const baseline = draft ?? profile;
      if (draft) this.draftStatus.set(draft.status);
      this.displayName.set(baseline.displayName);
      this.scientificName.set(baseline.scientificName ?? '');
      this.description.set(baseline.description);
      this.sectionContent.set(baseline.sections[0]?.content ?? '');
      this.state.set('ready');
    } catch {
      this.errorMessage.set('No se ha podido cargar el perfil editorial.');
      this.state.set('failure');
    }
  }

  private createDraft(current: SpeciesProfile): SpeciesProfileDraft {
    return {
      speciesProfileId: current.id,
      status: this.draftStatus(),
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
  }
}
