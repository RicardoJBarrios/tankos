import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../../shared/application/active-aquarium-context-storage';
import { aquariumIdFrom } from '../../../shared/domain/aquarium-reference';
import { ListLivestock } from '../../application/list-livestock';
import { RemoveLivestock } from '../../application/remove-livestock';
import {
  LivestockListItem,
  SpeciesProfileCatalog,
} from '../../application/ports';
import { LIVESTOCK_SPECIES_PROFILE_CATALOG } from '../providers';
import { ListLivestockPage } from './list-livestock-page';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const item: LivestockListItem = {
  id: '123e4567-e89b-42d3-a456-426614174001' as LivestockListItem['id'],
  aquariumId,
  speciesProfileId: 'species-clownfish',
  category: 'fish',
  representation: 'individual',
  displayName: 'Nemo',
  lifecycle: 'active',
  associationHistory: [
    {
      aquariumId,
      associatedAt: new Date('2026-08-08T10:00:00.000Z'),
    },
  ],
  associatedAt: new Date('2026-08-08T10:00:00.000Z'),
  updatedAt: new Date('2026-08-08T10:00:00.000Z'),
};

describe('ListLivestockPage', () => {
  const execute = vi.fn();
  const listPublished = vi.fn();
  const speciesProfileCatalog: SpeciesProfileCatalog = { listPublished };

  const createComponent = createComponentFactory({
    component: ListLivestockPage,
    providers: [
      provideRouter([]),
      {
        provide: ActiveAquariumContext,
        useFactory: () => {
          const storage: ActiveAquariumContextStorage = {
            load: vi.fn(),
            save: vi.fn(),
            clear: vi.fn(),
          };
          const context = new ActiveAquariumContext(storage);
          context.select(aquariumId);
          return context;
        },
      },
      {
        provide: LIVESTOCK_SPECIES_PROFILE_CATALOG,
        useValue: speciesProfileCatalog,
      },
    ],
    overrideComponents: [
      [
        ListLivestockPage,
        {
          set: {
            providers: [
              { provide: ListLivestock, useValue: { execute } },
              { provide: RemoveLivestock, useValue: { execute: vi.fn() } },
            ],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset();
    listPublished.mockReset();
    execute.mockResolvedValue([item]);
    listPublished.mockResolvedValue([
      { id: 'species-clownfish', displayName: 'Pez payaso' },
    ]);
  });

  async function settle(spectator: Spectator<ListLivestockPage>) {
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  it('shows the published species name next to the livestock record', async () => {
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('li')?.textContent).toContain('Especie: Pez payaso');
    expect(listPublished).toHaveBeenCalledOnce();
  });

  it('keeps the record visible when its species profile is unavailable', async () => {
    listPublished.mockResolvedValue([]);
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('li')?.textContent).toContain('Nemo');
    expect(spectator.query('li')?.textContent).toContain(
      'Especie: Especie no disponible',
    );
  });
});
