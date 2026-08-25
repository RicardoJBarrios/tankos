import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetLivestock } from '../../application/get-livestock';
import {
  LivestockListItem,
  SpeciesProfileCatalog,
} from '../../application/ports';
import { LIVESTOCK_SPECIES_PROFILE_CATALOG } from '../providers';
import { LivestockDetailPage } from './livestock-detail-page';

const item: LivestockListItem = {
  id: '123e4567-e89b-42d3-a456-426614174001' as LivestockListItem['id'],
  aquariumId:
    '123e4567-e89b-42d3-a456-426614174000' as LivestockListItem['aquariumId'],
  speciesProfileId: 'species-clownfish',
  category: 'fish',
  representation: 'individual',
  displayName: 'Nemo',
  lifecycle: 'active',
  associationHistory: [
    {
      aquariumId:
        '123e4567-e89b-42d3-a456-426614174000' as LivestockListItem['aquariumId'],
      associatedAt: new Date('2026-08-08T10:00:00.000Z'),
    },
  ],
  associatedAt: new Date('2026-08-08T10:00:00.000Z'),
  updatedAt: new Date('2026-08-08T10:00:00.000Z'),
};

describe('LivestockDetailPage', () => {
  const execute = vi.fn();
  const listPublished = vi.fn();
  const speciesProfileCatalog: SpeciesProfileCatalog = { listPublished };

  const createComponent = createComponentFactory({
    component: LivestockDetailPage,
    providers: [
      provideRouter([]),
      {
        provide: LIVESTOCK_SPECIES_PROFILE_CATALOG,
        useValue: speciesProfileCatalog,
      },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => item.id } } },
      },
    ],
    overrideComponents: [
      [
        LivestockDetailPage,
        {
          set: {
            providers: [{ provide: GetLivestock, useValue: { execute } }],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset();
    listPublished.mockReset();
    execute.mockResolvedValue(item);
    listPublished.mockResolvedValue([
      {
        id: 'species-clownfish',
        displayName: 'Pez payaso',
        scientificName: 'Amphiprion ocellaris',
      },
    ]);
  });

  async function settle(spectator: Spectator<LivestockDetailPage>) {
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  it('shows the individual sheet with species and association history', async () => {
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('h2')?.textContent).toContain('Nemo');
    expect(spectator.query('dl')?.textContent).toContain('Pez payaso');
    expect(spectator.query('dl')?.textContent).toContain(
      'Amphiprion ocellaris',
    );
    expect(spectator.query('ol')?.textContent).toContain(
      '123e4567-e89b-42d3-a456-426614174000',
    );
  });
});
