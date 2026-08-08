import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AquariumListItem } from '../application/aquarium-ports';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../application/active-aquarium-context-storage';
import { ListMyAquariums } from '../application/list-my-aquariums';
import { SelectAquarium } from '../application/select-aquarium';
import { AquariumName, aquariumIdFrom } from '../domain/aquarium';
import { ListMyAquariumsPage } from './list-my-aquariums-page';

const aquarium = (id: string, name: string): AquariumListItem => ({
  id: aquariumIdFrom(id),
  name: AquariumName.create(name),
});

describe('ListMyAquariumsPage', () => {
  const execute = vi.fn();
  const selectAquarium = vi.fn();
  const createComponent = createComponentFactory({
    component: ListMyAquariumsPage,
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
          return new ActiveAquariumContext(storage);
        },
      },
    ],
    overrideComponents: [
      [
        ListMyAquariumsPage,
        {
          set: {
            providers: [
              { provide: ListMyAquariums, useValue: { execute } },
              {
                provide: SelectAquarium,
                useValue: { execute: selectAquarium },
              },
            ],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset();
    selectAquarium.mockReset();
  });

  it('renders loading state accessibly', () => {
    const load = new Promise<readonly AquariumListItem[]>(() => undefined);
    execute.mockReturnValue(load);
    const spectator: Spectator<ListMyAquariumsPage> = createComponent();

    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Cargando acuarios',
    );
  });

  it('renders an empty state with the establishment action', async () => {
    execute.mockResolvedValue([]);
    const spectator: Spectator<ListMyAquariumsPage> = createComponent();
    await new Promise((resolve) => setTimeout(resolve, 0));
    spectator.detectChanges();

    expect(spectator.query('.empty-state p')?.textContent).toContain(
      'ningún acuario todavía',
    );
    expect(spectator.query('a')?.getAttribute('href')).toBe(
      '/app/aquariums/new',
    );
  });

  it('renders one or multiple Aquarium names without navigation', async () => {
    execute.mockResolvedValue([
      aquarium('123e4567-e89b-42d3-a456-426614174000', 'Veril'),
      aquarium('123e4567-e89b-42d3-a456-426614174001', 'Acuario auxiliar'),
    ]);
    const spectator: Spectator<ListMyAquariumsPage> = createComponent();
    await new Promise((resolve) => setTimeout(resolve, 0));
    spectator.detectChanges();

    expect(
      spectator.queryAll('li').map((element) => element.textContent?.trim()),
    ).toEqual(['Veril', 'Acuario auxiliar']);
    expect(spectator.queryAll('a')).toHaveLength(1);
  });

  it('selects an Aquarium from the list', async () => {
    execute.mockResolvedValue([
      aquarium('123e4567-e89b-42d3-a456-426614174000', 'Veril'),
    ]);
    const spectator: Spectator<ListMyAquariumsPage> = createComponent();
    selectAquarium.mockImplementation(async (id) => {
      spectator.inject(ActiveAquariumContext).select(id);
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    spectator.detectChanges();

    await spectator.click('button');
    spectator.detectChanges();

    expect(selectAquarium).toHaveBeenCalledWith(
      '123e4567-e89b-42d3-a456-426614174000',
    );
    expect(spectator.query('button')?.getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(
      spectator
        .queryAll('a')
        .find((link) =>
          link.getAttribute('href')?.includes('/observations/new'),
        )
        ?.getAttribute('href'),
    ).toBe('/app/aquariums/observations/new');
  });

  it('renders a failure state', async () => {
    execute.mockRejectedValue(new Error('offline'));
    const spectator: Spectator<ListMyAquariumsPage> = createComponent();
    await new Promise((resolve) => setTimeout(resolve, 0));
    spectator.detectChanges();

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se han podido cargar',
    );
  });
});
