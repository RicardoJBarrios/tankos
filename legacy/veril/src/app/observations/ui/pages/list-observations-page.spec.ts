import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../../shared/application/active-aquarium-context-storage';
import { ListObservations } from '../../application/list-observations';
import { ObservationListItem } from '../../application/ports';
import {
  aquariumIdFrom,
  aquariumTimeZoneFrom,
} from '../../../shared/domain/aquarium-reference';
import { ListObservationsPage } from './list-observations-page';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const item: ObservationListItem = {
  id: '123e4567-e89b-42d3-a456-426614174001' as ObservationListItem['id'],
  content: 'El coral está abierto',
  recordedAt: new Date('2026-08-08T10:00:00.000Z'),
};

describe('ListObservationsPage', () => {
  const execute = vi.fn();
  let includeActiveContext = true;

  const createComponent = createComponentFactory({
    component: ListObservationsPage,
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
          if (includeActiveContext) {
            context.select(aquariumId);
          }
          return context;
        },
      },
    ],
    overrideComponents: [
      [
        ListObservationsPage,
        {
          set: {
            providers: [{ provide: ListObservations, useValue: { execute } }],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    includeActiveContext = true;
    execute.mockReset();
  });

  async function settle(spectator: Spectator<ListObservationsPage>) {
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  it('shows recovery without Active Context and does not query', () => {
    includeActiveContext = false;
    const spectator = createComponent();

    expect(execute).not.toHaveBeenCalled();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
  });

  it('shows loading while the read is pending', () => {
    execute.mockReturnValue(new Promise(() => undefined));
    const spectator = createComponent();

    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Cargando observaciones',
    );
  });

  it('shows the empty state with a record action', async () => {
    execute.mockResolvedValue({ items: [] });
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('.empty-state p')?.textContent).toContain(
      'No hay observaciones registradas',
    );
    expect(
      spectator
        .queryAll('a')
        .some(
          (link) =>
            link.getAttribute('href') === '/app/aquariums/observations/new',
        ),
    ).toBe(true);
  });

  it('renders qualitative evidence and its recorded time', async () => {
    execute.mockResolvedValue({ items: [item] });
    const spectator = createComponent();
    spectator.component.timeZone.set(aquariumTimeZoneFrom('Atlantic/Canary'));
    await settle(spectator);

    expect(spectator.query('li')?.textContent).toContain(
      'El coral está abierto',
    );
    expect(spectator.query('time')?.getAttribute('datetime')).toBe(
      item.recordedAt.toISOString(),
    );
    expect(spectator.query('time')?.textContent).toContain('11:00');
  });

  it('shows a recoverable error', async () => {
    execute.mockRejectedValue(new Error('offline'));
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se han podido cargar las observaciones',
    );
  });
});
