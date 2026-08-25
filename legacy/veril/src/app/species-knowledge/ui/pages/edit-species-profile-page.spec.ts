import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SpeciesProfile } from '../../domain/species-profile';
import {
  PublishedSpeciesProfileReader,
  SpeciesProfileDraftWriter,
} from '../../application/ports';
import {
  PUBLISHED_SPECIES_PROFILE_READER,
  SPECIES_PROFILE_DRAFT_READER,
  SPECIES_PROFILE_DRAFT_WRITER,
  SPECIES_PROFILE_PUBLISHER,
  SPECIES_PROFILE_REVIEWER,
  SPECIES_PROFILE_RETIRER,
} from '../providers';
import { EditSpeciesProfilePage } from './edit-species-profile-page';

const profile: SpeciesProfile = {
  id: '123e4567-e89b-42d3-a456-426614174100' as SpeciesProfile['id'],
  displayName: 'Pez payaso',
  scientificName: 'Amphiprion ocellaris',
  status: 'published',
  description: 'Descripción publicada.',
  sections: [
    {
      key: 'identification',
      title: 'Identificación',
      content: 'Contenido publicado.',
    },
  ],
  sources: [
    { id: 'source-1', title: 'Fuente', url: 'https://example.test/source' },
  ],
  revision: { id: 'revision-1', publishedAt: new Date('2026-08-16') },
};

describe('EditSpeciesProfilePage', () => {
  const getPublished = vi.fn();
  const getDraft = vi.fn();
  const saveDraft = vi.fn();
  const publishDraft = vi.fn();
  const reader: PublishedSpeciesProfileReader = {
    listPublished: vi.fn(),
    getPublished,
  };
  const writer: SpeciesProfileDraftWriter = { saveDraft };
  const createComponent = createComponentFactory({
    component: EditSpeciesProfilePage,
    providers: [
      provideRouter([]),
      { provide: PUBLISHED_SPECIES_PROFILE_READER, useValue: reader },
      { provide: SPECIES_PROFILE_DRAFT_WRITER, useValue: writer },
      { provide: SPECIES_PROFILE_DRAFT_READER, useValue: { getDraft } },
      { provide: SPECIES_PROFILE_PUBLISHER, useValue: { publishDraft } },
      { provide: SPECIES_PROFILE_REVIEWER, useValue: { reviewDraft: vi.fn() } },
      {
        provide: SPECIES_PROFILE_RETIRER,
        useValue: { retireProfile: vi.fn() },
      },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => profile.id } } },
      },
    ],
  });

  beforeEach(() => {
    getPublished.mockReset();
    getPublished.mockResolvedValue(profile);
    getDraft.mockResolvedValue(null);
    saveDraft.mockReset();
    saveDraft.mockResolvedValue(undefined);
    publishDraft.mockReset();
    publishDraft.mockResolvedValue(undefined);
  });

  async function settle(spectator: Spectator<EditSpeciesProfilePage>) {
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  it('loads the published profile as the editing baseline', async () => {
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.component.displayName()).toBe('Pez payaso');
    expect(spectator.component.description()).toBe('Descripción publicada.');
  });

  it('saves edited Markdown as a draft', async () => {
    const spectator = createComponent();
    await settle(spectator);
    spectator.component.description.set('**Descripción revisada**.');
    spectator.component.sectionContent.set('Identificación revisada.');

    await spectator.component.saveDraft();

    expect(saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        speciesProfileId: profile.id,
        description: '**Descripción revisada**.',
        sources: profile.sources,
      }),
    );
    expect(spectator.component.state()).toBe('saved');
  });
});
