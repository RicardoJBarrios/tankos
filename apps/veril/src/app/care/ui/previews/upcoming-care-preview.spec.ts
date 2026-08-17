import { createComponentFactory } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../../shared/application/active-aquarium-context-storage';
import { ListPlannedCareWork } from '../../application/list-planned-care-work';
import {
  aquariumIdFrom,
  aquariumTimeZoneFrom,
} from '../../../shared/domain/aquarium-reference';
import { UpcomingCarePreview } from './upcoming-care-preview';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const items = [
  {
    id: '123e4567-e89b-42d3-a456-426614174001' as never,
    description: 'Revisar el skimmer',
    plannedFor: new Date('2026-08-12T10:00:00.000Z'),
    recordedAt: new Date('2026-08-09T10:00:00.000Z'),
  },
];

describe('UpcomingCarePreview', () => {
  const execute = vi.fn();
  let includeActiveContext = true;

  const createComponent = createComponentFactory({
    component: UpcomingCarePreview,
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
          if (includeActiveContext) context.select(aquariumId);
          return context;
        },
      },
    ],
    overrideComponents: [
      [
        UpcomingCarePreview,
        {
          set: {
            providers: [
              { provide: ListPlannedCareWork, useValue: { execute } },
            ],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset();
    includeActiveContext = true;
  });

  it('does not query without Active Context', () => {
    includeActiveContext = false;
    const spectator = createComponent();

    expect(execute).not.toHaveBeenCalled();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
  });

  it('renders loading, empty, planning and full-list navigation', async () => {
    let resolve!: (value: typeof items) => void;
    execute.mockReturnValue(new Promise((done) => (resolve = done)));
    const loading = createComponent();
    expect(loading.query('[role="status"]')?.textContent).toContain(
      'Cargando cuidados pendientes',
    );

    resolve({ items: [] } as never);
    await loading.fixture.whenStable();
    loading.detectChanges();
    expect(loading.query('.empty-state')?.textContent).toContain(
      'No hay cuidados planificados',
    );
    expect(
      loading.query('a[href="/app/aquariums/care/planned/new"]'),
    ).toBeTruthy();
    expect(loading.query('a[href="/app/aquariums/care/planned"]')).toBeTruthy();
  });

  it('renders up to three ordered items and the planned date', async () => {
    execute.mockResolvedValue({ items });
    const spectator = createComponent();
    spectator.component.now.set(new Date('2026-08-10T10:00:00.000Z'));
    spectator.component.timeZone = aquariumTimeZoneFrom('Atlantic/Canary');
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(execute).toHaveBeenCalledWith(undefined, 3);
    expect(spectator.queryAll('li')).toHaveLength(1);
    expect(spectator.query('.care-description')?.textContent).toContain(
      'Revisar el skimmer',
    );
    expect(spectator.query('time')?.textContent).toContain('Previsto para');
    expect(spectator.query('.care-timing')?.textContent).toContain('Pendiente');
    expect(spectator.query('time')?.textContent).toContain('11:00');
  });

  it('shows overdue text without changing the planned timestamp', async () => {
    execute.mockResolvedValue({ items: [
      {
        ...items[0],
        plannedFor: new Date('2026-08-08T10:00:00.000Z'),
      },
    ] });
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.component.now.set(new Date('2026-08-10T10:00:00.000Z'));
    spectator.detectChanges();

    expect(spectator.query('.care-timing')?.textContent).toContain('Vencido');
    expect(spectator.query('time')?.getAttribute('datetime')).toBe(
      '2026-08-08T10:00:00.000Z',
    );
  });

  it('isolates recoverable failures to the section', async () => {
    execute.mockRejectedValue(new Error('offline'));
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se han podido cargar los cuidados pendientes',
    );
  });
});
