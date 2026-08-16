import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../../shared/application/active-aquarium-context-storage';
import { ListMeasurements } from '../../application/list-measurements';
import { MeasurementListItem, MeasurementPage } from '../../application/ports';
import {
  aquariumIdFrom,
  aquariumTimeZoneFrom,
} from '../../../shared/domain/aquarium-reference';
import { ListMeasurementsPage } from './list-measurements-page';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const item: MeasurementListItem = {
  id: '123e4567-e89b-42d3-a456-426614174001' as MeasurementListItem['id'],
  parameterId: 'temperature',
  canonicalValue: 23.5,
  canonicalUnit: 'celsius',
  measuredAt: new Date('2026-08-08T10:00:00.000Z'),
  recordedAt: new Date('2026-08-08T10:01:00.000Z'),
  provenance: 'manual',
};

describe('ListMeasurementsPage', () => {
  const execute = vi.fn();
  let includeActiveContext = true;

  const createComponent = createComponentFactory({
    component: ListMeasurementsPage,
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
        ListMeasurementsPage,
        {
          set: {
            providers: [{ provide: ListMeasurements, useValue: { execute } }],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    includeActiveContext = true;
    execute.mockReset();
  });

  async function settle(spectator: Spectator<ListMeasurementsPage>) {
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  it('shows the recovery state without Active Context', () => {
    includeActiveContext = false;
    const spectator = createComponent();

    expect(execute).not.toHaveBeenCalled();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
    expect(
      spectator
        .queryAll('a')
        .find((link) => link.getAttribute('href') === '/app/aquariums')
        ?.getAttribute('href'),
    ).toBe('/app/aquariums');
  });

  it('shows loading while the first page is pending', () => {
    execute.mockReturnValue(new Promise(() => undefined));
    const spectator = createComponent();

    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Cargando mediciones',
    );
  });

  it('shows an empty state and link to record a Measurement', async () => {
    execute.mockResolvedValue({ items: [] } satisfies MeasurementPage);
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('.empty-state p')?.textContent).toContain(
      'No hay mediciones registradas',
    );
    expect(spectator.query('a')?.getAttribute('href')).toBe(
      '/app/aquariums/measurements/new',
    );
  });

  it('renders ordered results and exposes continuation', async () => {
    const page = {
      items: [item],
      nextCursor: 'next-page' as never,
    } satisfies MeasurementPage;
    execute.mockResolvedValue(page);
    const spectator = createComponent();
    spectator.component.now.set(new Date('2026-08-10T12:00:00.000Z'));
    spectator.component.timeZone.set(aquariumTimeZoneFrom('Atlantic/Canary'));
    await settle(spectator);

    expect(spectator.query('li')?.textContent).toContain('Temperatura');
    expect(spectator.query('li')?.textContent).toContain('23.5 °C');
    expect(spectator.query('time')?.textContent).toContain('11:00');
    expect(spectator.query('li')?.textContent).toContain('Hace 2 días');
    expect(spectator.query('button')?.textContent).toContain('Cargar más');
  });

  it('loads the next page without replacing existing results', async () => {
    execute
      .mockResolvedValueOnce({
        items: [item],
        nextCursor: 'next-page' as never,
      })
      .mockResolvedValueOnce({ items: [] });
    const spectator = createComponent();
    await settle(spectator);

    await spectator.click('button');
    await settle(spectator);

    expect(spectator.queryAll('li')).toHaveLength(1);
    expect(execute).toHaveBeenNthCalledWith(2, 'next-page', 20);
    expect(spectator.query('button')).toBeNull();
  });

  it('allows a bounded page size change and reloads from the first page', async () => {
    execute
      .mockResolvedValueOnce({
        items: [item],
        nextCursor: 'next-page' as never,
      })
      .mockResolvedValueOnce({ items: [] });
    const spectator = createComponent();
    await settle(spectator);

    spectator.selectOption('select', '50');
    await settle(spectator);

    expect(spectator.component.pageSize()).toBe(50);
    expect(execute).toHaveBeenNthCalledWith(2, undefined, 50);
  });

  it('shows recoverable errors', async () => {
    execute.mockRejectedValue(new Error('offline'));
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se han podido cargar las mediciones',
    );
  });

  it('exposes pending state while loading more', async () => {
    let resolveNext!: (page: MeasurementPage) => void;
    execute
      .mockResolvedValueOnce({
        items: [item],
        nextCursor: 'next-page' as never,
      })
      .mockReturnValueOnce(new Promise((resolve) => (resolveNext = resolve)));
    const spectator = createComponent();
    await settle(spectator);

    const click = spectator.click('button');
    spectator.detectChanges();
    expect(spectator.query('button')?.textContent).toContain('Cargando');
    expect(spectator.query('button')?.hasAttribute('disabled')).toBe(true);

    resolveNext({ items: [] });
    await click;
  });
});
