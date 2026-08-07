import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AquariumListItem } from '../application/aquarium-ports';
import { ListMyAquariums } from '../application/list-my-aquariums';
import { aquariumIdFrom } from '../domain/aquarium-id';
import { AquariumName } from '../domain/aquarium-name';
import { ListMyAquariumsPage } from './list-my-aquariums-page';

const aquarium = (id: string, name: string): AquariumListItem => ({
  id: aquariumIdFrom(id),
  name: AquariumName.create(name),
});

describe('ListMyAquariumsPage', () => {
  const execute = vi.fn();
  const createComponent = createComponentFactory({
    component: ListMyAquariumsPage,
    overrideComponents: [
      [
        ListMyAquariumsPage,
        {
          set: {
            providers: [{ provide: ListMyAquariums, useValue: { execute } }],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset();
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

    expect(spectator.query('p')?.textContent).toContain(
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
      spectator.queryAll('li').map((element) => element.textContent),
    ).toEqual(['Veril', 'Acuario auxiliar']);
    expect(spectator.queryAll('a')).toHaveLength(0);
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
