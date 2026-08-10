import { createComponentFactory } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../application/active-aquarium-context-storage';
import { ConfigureAquariumLocation } from '../application/configure-aquarium-location';
import { SearchAquariumLocations } from '../application/search-aquarium-locations';
import { AquariumName, aquariumIdFrom } from '../domain/aquarium';
import {
  AQUARIUM_REPOSITORY,
  KEEPER_SESSION,
  LOCATION_SEARCH,
} from './aquarium-providers';
import { ConfigureAquariumLocationPage } from './configure-aquarium-location-page';

const activeId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const candidate = {
  latitude: 28.12,
  longitude: -16.46,
  displayName: 'Santa Cruz, Canarias, España',
};

describe('ConfigureAquariumLocationPage', () => {
  const execute = vi.fn();
  const getOwned = vi.fn();
  const search = vi.fn();
  const createComponent = createComponentFactory({
    component: ConfigureAquariumLocationPage,
    providers: [provideRouter([])],
    overrideComponents: [
      [
        ConfigureAquariumLocationPage,
        {
          set: {
            providers: [
              { provide: ConfigureAquariumLocation, useValue: { execute } },
              {
                provide: SearchAquariumLocations,
                useValue: { execute: search },
              },
              { provide: AQUARIUM_REPOSITORY, useValue: { getOwned } },
              {
                provide: KEEPER_SESSION,
                useValue: {
                  requireAuthenticatedKeeper: vi
                    .fn()
                    .mockResolvedValue({ id: 'keeper-1' }),
                },
              },
              { provide: LOCATION_SEARCH, useValue: { search } },
              {
                provide: ActiveAquariumContext,
                useFactory: () => {
                  const storage: ActiveAquariumContextStorage = {
                    load: vi.fn(),
                    save: vi.fn(),
                    clear: vi.fn(),
                  };
                  const context = new ActiveAquariumContext(storage);
                  context.select(activeId);
                  return context;
                },
              },
            ],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset().mockResolvedValue(candidate);
    search.mockReset().mockResolvedValue([candidate]);
    getOwned
      .mockReset()
      .mockResolvedValue({ id: activeId, name: AquariumName.create('Veril') });
  });

  it('searches and requires selecting a result before configuring', async () => {
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
    spectator.component.query.setValue('Santa Cruz');
    await spectator.component.search();
    spectator.detectChanges();
    expect(search).toHaveBeenCalledWith('Santa Cruz');
    expect(execute).not.toHaveBeenCalled();
    await spectator.click('.location-result');
    await spectator.click('[data-testid="confirm-location"]');
    expect(execute).toHaveBeenCalledWith(candidate);
  });

  it('does not expose configuration for an Aquarium with a location', async () => {
    getOwned.mockResolvedValue({
      id: activeId,
      name: AquariumName.create('Veril'),
      location: candidate,
    });
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
    expect(spectator.query('form')).toBeFalsy();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'ya está configurada',
    );
  });
});
