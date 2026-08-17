import { createComponentFactory } from '@ngneat/spectator/vitest';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SpeciesProfile } from '../../domain/species-profile';
import { SpeciesProfileRevisionReader } from '../../application/ports';
import { SPECIES_PROFILE_REVISION_READER } from '../providers';
import { SpeciesProfileHistoryPage } from './species-profile-history-page';

const profile: SpeciesProfile = {
  id: '123e4567-e89b-42d3-a456-426614174100' as SpeciesProfile['id'],
  displayName: 'Pez payaso',
  scientificName: 'Amphiprion ocellaris',
  status: 'published',
  description: 'Descripción histórica en **Markdown**.',
  sections: [
    {
      key: 'identification',
      title: 'Identificación',
      content: 'Contenido histórico.',
    },
  ],
  sources: [],
  revision: {
    id: 'revision-1',
    publishedAt: new Date('2026-08-16T12:00:00.000Z'),
  },
};

describe('SpeciesProfileHistoryPage', () => {
  const listRevisions = vi.fn();
  const reader: SpeciesProfileRevisionReader = { listRevisions };
  const createComponent = createComponentFactory({
    component: SpeciesProfileHistoryPage,
    providers: [
      provideRouter([]),
      { provide: SPECIES_PROFILE_REVISION_READER, useValue: reader },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: { get: () => profile.id } },
        },
      },
    ],
  });

  beforeEach(() => {
    listRevisions.mockReset();
    listRevisions.mockResolvedValue([profile]);
  });

  it('renders immutable revision content in reverse publication order', async () => {
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(spectator.query('mat-card-title')?.textContent).toContain(
      'revision-1',
    );
    expect(spectator.query('.markdown-content')?.textContent).toContain(
      'Descripción histórica en Markdown.',
    );
    expect(listRevisions).toHaveBeenCalledWith(profile.id);
  });
});
