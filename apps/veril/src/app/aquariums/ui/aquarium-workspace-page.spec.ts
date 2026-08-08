import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AquariumListItem } from '../application/aquarium-ports';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../application/active-aquarium-context-storage';
import { ListMyAquariums } from '../application/list-my-aquariums';
import { AquariumName, aquariumIdFrom } from '../domain/aquarium';
import { AquariumWorkspacePage } from './aquarium-workspace-page';

const activeId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const aquarium: AquariumListItem = {
  id: activeId,
  name: AquariumName.create('Veril'),
};

describe('AquariumWorkspacePage', () => {
  const execute = vi.fn();
  let contextSelected = false;
  const createContext = (selected = false): ActiveAquariumContext => {
    const storage: ActiveAquariumContextStorage = {
      load: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
    };
    const context = new ActiveAquariumContext(storage);
    if (selected) {
      context.select(activeId);
    }
    return context;
  };

  const createComponent = createComponentFactory({
    component: AquariumWorkspacePage,
    providers: [provideRouter([])],
    overrideComponents: [
      [
        AquariumWorkspacePage,
        {
          set: {
            providers: [
              { provide: ListMyAquariums, useValue: { execute } },
              {
                provide: ActiveAquariumContext,
                useFactory: () => createContext(contextSelected),
              },
            ],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset();
  });

  it('explains how to recover when there is no active Aquarium', () => {
    contextSelected = false;
    const spectator = createComponent();

    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it('renders the selected Aquarium and grouped capabilities', async () => {
    contextSelected = true;
    execute.mockResolvedValue([aquarium]);
    const spectator: Spectator<AquariumWorkspacePage> = createComponent();
    await new Promise((resolve) => setTimeout(resolve, 0));
    spectator.detectChanges();

    expect(spectator.query('h2')?.textContent).toContain('Veril');
    expect(
      spectator.queryAll('h3').map((heading) => heading.textContent),
    ).toEqual(['Registrar', 'Consultar']);
    expect(
      spectator.queryAll('a').map((link) => link.textContent?.trim()),
    ).toEqual(
      expect.arrayContaining(['Registrar observación', 'Actividad reciente']),
    );
  });
});
