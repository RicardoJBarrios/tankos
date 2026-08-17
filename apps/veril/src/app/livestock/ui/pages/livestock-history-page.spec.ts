import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListLivestockHistory } from '../../application/list-livestock-history';
import {
  LivestockListItem,
  SpeciesProfileCatalog,
} from '../../application/ports';
import { LIVESTOCK_SPECIES_PROFILE_CATALOG } from '../providers';
import { LivestockHistoryPage } from './livestock-history-page';

const item: LivestockListItem = {
  id: '123e4567-e89b-42d3-a456-426614174001' as LivestockListItem['id'],
  aquariumId:
    '123e4567-e89b-42d3-a456-426614174000' as LivestockListItem['aquariumId'],
  speciesProfileId: 'species-zoanthus',
  category: 'coral',
  representation: 'group',
  displayName: 'Colonia roja',
  lifecycle: 'removed',
  associationHistory: [
    {
      aquariumId:
        '123e4567-e89b-42d3-a456-426614174000' as LivestockListItem['aquariumId'],
      associatedAt: new Date('2026-08-08T10:00:00.000Z'),
    },
  ],
  associatedAt: new Date('2026-08-08T10:00:00.000Z'),
  updatedAt: new Date('2026-08-09T10:00:00.000Z'),
};

describe('LivestockHistoryPage', () => {
  const execute = vi.fn();
  const listPublished = vi.fn();
  const speciesProfileCatalog: SpeciesProfileCatalog = { listPublished };

  const createComponent = createComponentFactory({
    component: LivestockHistoryPage,
    providers: [
      provideRouter([]),
      {
        provide: LIVESTOCK_SPECIES_PROFILE_CATALOG,
        useValue: speciesProfileCatalog,
      },
    ],
    overrideComponents: [
      [
        LivestockHistoryPage,
        {
          set: {
            providers: [
              { provide: ListLivestockHistory, useValue: { execute } },
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
      { id: 'species-zoanthus', displayName: 'Zoanthus' },
    ]);
  });

  async function settle(spectator: Spectator<LivestockHistoryPage>) {
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  it('shows the species name in the traceability history', async () => {
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('li')?.textContent).toContain('Especie: Zoanthus');
  });

  it('shows a loading state while history and species are pending', () => {
    execute.mockReturnValue(new Promise(() => undefined));
    listPublished.mockReturnValue(new Promise(() => undefined));
    const spectator = createComponent();

    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Cargando historial',
    );
  });
});
