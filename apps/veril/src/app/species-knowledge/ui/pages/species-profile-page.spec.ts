import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SpeciesProfile } from '../../domain/species-profile';
import { PublishedSpeciesProfileReader } from '../../application/ports';
import { PUBLISHED_SPECIES_PROFILE_READER } from '../providers';
import { SpeciesProfilePage } from './species-profile-page';

const profile: SpeciesProfile = {
  id: '123e4567-e89b-42d3-a456-426614174100' as SpeciesProfile['id'],
  displayName: 'Pez payaso',
  scientificName: 'Amphiprion ocellaris',
  status: 'published',
  description: 'Contenido documental de prueba.',
};

describe('SpeciesProfilePage', () => {
  const getPublished = vi.fn();
  const reader: PublishedSpeciesProfileReader = {
    listPublished: vi.fn(),
    getPublished,
  };

  const createComponent = createComponentFactory({
    component: SpeciesProfilePage,
    providers: [
      provideRouter([]),
      {
        provide: PUBLISHED_SPECIES_PROFILE_READER,
        useValue: reader,
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
  });

  async function settle(spectator: Spectator<SpeciesProfilePage>) {
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  it('shows the published shared documentary profile', async () => {
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('h2')?.textContent).toContain('Pez payaso');
    expect(spectator.query('.scientific-name')?.textContent).toContain(
      'Amphiprion ocellaris',
    );
    expect(spectator.query('mat-card')?.textContent).toContain(
      'Contenido documental de prueba.',
    );
  });
});
