import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../../shared/application/active-aquarium-context-storage';
import { ConfigureAquariumTimeZone } from '../../application/configure-aquarium-time-zone';
import { AquariumName, aquariumIdFrom } from '../../domain/aquarium';
import {
  AQUARIUM_REPOSITORY,
  AQUARIUM_TIME_ZONE_CONFIGURER,
  KEEPER_SESSION,
} from '../providers';
import { ConfigureAquariumTimeZonePage } from './configure-aquarium-time-zone-page';

const activeId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

function createContext(selected = true): ActiveAquariumContext {
  const storage: ActiveAquariumContextStorage = {
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  };
  const context = new ActiveAquariumContext(storage);
  if (selected) context.select(activeId);
  return context;
}

describe('ConfigureAquariumTimeZonePage', () => {
  const configure = vi.fn();
  const getOwned = vi.fn();
  const createComponent = createComponentFactory({
    component: ConfigureAquariumTimeZonePage,
    providers: [
      provideRouter([]),
      {
        provide: ActiveAquariumContext,
        useFactory: () => createContext(),
      },
    ],
    overrideComponents: [
      [
        ConfigureAquariumTimeZonePage,
        {
          set: {
            providers: [
              {
                provide: ConfigureAquariumTimeZone,
                useValue: { execute: configure },
              },
              {
                provide: AQUARIUM_REPOSITORY,
                useValue: { getOwned },
              },
              {
                provide: AQUARIUM_TIME_ZONE_CONFIGURER,
                useValue: { configure },
              },
              {
                provide: KEEPER_SESSION,
                useValue: {
                  requireAuthenticatedKeeper: vi.fn().mockResolvedValue({
                    id: 'keeper-1',
                  }),
                },
              },
            ],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    configure.mockReset();
    getOwned.mockReset();
    configure.mockResolvedValue('Atlantic/Canary');
    getOwned.mockResolvedValue({
      id: activeId,
      name: AquariumName.create('Veril'),
    });
  });

  it('shows the missing timezone form and requires explicit confirmation', async () => {
    const spectator = createComponent();
    await new Promise((resolve) => setTimeout(resolve, 0));
    spectator.detectChanges();

    expect(spectator.query('form')).toBeTruthy();
    expect(spectator.query('input[type="checkbox"]')).toBeTruthy();
    expect(spectator.query('input#aquarium-time-zone')).toBeTruthy();
  });

  it('saves only after confirmation and shows success', async () => {
    const spectator: Spectator<ConfigureAquariumTimeZonePage> =
      createComponent();
    await new Promise((resolve) => setTimeout(resolve, 0));
    spectator.detectChanges();

    await spectator.click('button[type="submit"]');
    expect(configure).not.toHaveBeenCalled();

    await spectator.click('input[type="checkbox"]');
    await spectator.click('button[type="submit"]');
    spectator.detectChanges();

    expect(configure).toHaveBeenCalled();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'configurada correctamente',
    );
  });

  it('does not expose editing for an already configured Aquarium', async () => {
    getOwned.mockResolvedValue({
      id: activeId,
      name: AquariumName.create('Veril'),
      timeZone: 'Atlantic/Canary',
    });
    const spectator = createComponent();
    await new Promise((resolve) => setTimeout(resolve, 0));
    spectator.detectChanges();

    expect(spectator.query('form')).toBeFalsy();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'ya está configurada',
    );
    expect(spectator.query('input#aquarium-time-zone')).toBeFalsy();
  });
});
