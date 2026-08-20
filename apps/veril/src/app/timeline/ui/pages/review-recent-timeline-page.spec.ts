import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../../shared/application/active-aquarium-context-storage';
import {
  MeasurementTimelineItem,
  ObservationTimelineItem,
  CareWorkTimelineItem,
  ReviewRecentTimeline,
} from '../../application/review-recent-timeline';
import {
  aquariumIdFrom,
  aquariumTimeZoneFrom,
} from '../../../shared/domain/aquarium-reference';
import { ReviewRecentTimelinePage } from './review-recent-timeline-page';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const observation: ObservationTimelineItem = {
  kind: 'observation',
  observationId: '123e4567-e89b-42d3-a456-426614174001' as never,
  content: 'El coral está abierto',
  effectiveAt: new Date('2026-08-08T10:00:00.000Z'),
  recordedAt: new Date('2026-08-08T10:00:00.000Z'),
};
const measurement: MeasurementTimelineItem = {
  kind: 'measurement',
  measurementId: '123e4567-e89b-42d3-a456-426614174002' as never,
  parameterId: 'temperature',
  canonicalValue: 23.5,
  canonicalUnit: 'celsius',
  effectiveAt: new Date('2026-08-08T09:00:00.000Z'),
  measuredAt: new Date('2026-08-08T09:00:00.000Z'),
  recordedAt: new Date('2026-08-08T09:01:00.000Z'),
};
const careWork: CareWorkTimelineItem = {
  kind: 'care-work',
  careWorkId: '123e4567-e89b-42d3-a456-426614174003' as never,
  description: 'Limpié la copa del skimmer',
  effectiveAt: new Date('2026-08-08T08:00:00.000Z'),
  performedAt: new Date('2026-08-08T08:00:00.000Z'),
  recordedAt: new Date('2026-08-08T09:00:00.000Z'),
};

describe('ReviewRecentTimelinePage', () => {
  const execute = vi.fn();
  let includeActiveContext = true;

  const createComponent = createComponentFactory({
    component: ReviewRecentTimelinePage,
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
        ReviewRecentTimelinePage,
        {
          set: {
            providers: [
              { provide: ReviewRecentTimeline, useValue: { execute } },
            ],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    includeActiveContext = true;
    execute.mockReset();
  });

  async function settle(spectator: Spectator<ReviewRecentTimelinePage>) {
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
    expect(
      spectator
        .queryAll('a')
        .some((link) => link.getAttribute('href') === '/app/aquariums'),
    ).toBe(true);
  });

  it('shows loading while the Timeline read is pending', () => {
    execute.mockReturnValue(new Promise(() => undefined));
    const spectator = createComponent();

    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Cargando actividad reciente',
    );
  });

  it('renders mixed results with their semantic labels', async () => {
    execute.mockResolvedValue([observation, measurement, careWork]);
    const spectator = createComponent();
    spectator.component.timeZone.set(aquariumTimeZoneFrom('Atlantic/Canary'));
    await settle(spectator);

    expect(
      spectator.query('[data-testid="recent-timeline"]')?.textContent,
    ).toContain('Observación');
    expect(
      spectator.query('[data-testid="recent-timeline"]')?.textContent,
    ).toContain('Medición');
    expect(
      spectator.query('[data-testid="recent-timeline"]')?.textContent,
    ).toContain('23.5 °C');
    expect(
      spectator.query('[data-testid="recent-timeline"]')?.textContent,
    ).toContain('Cuidado');
    expect(
      spectator.query('[data-testid="recent-timeline"]')?.textContent,
    ).toContain('Limpié la copa del skimmer');
    expect(spectator.queryAll('time')[2]?.getAttribute('datetime')).toBe(
      '2026-08-08T08:00:00.000Z',
    );
    expect(spectator.queryAll('time')[0]?.textContent).toContain('11:00');
  });

  it('offers focused histories without leaving the Aquarium context', async () => {
    execute.mockResolvedValue([]);
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('h2')?.textContent).toContain('Historial');
    expect(
      spectator.queryAll('.history-links a').map((link) => ({
        label: link.textContent?.trim(),
        href: link.getAttribute('href'),
      })),
    ).toEqual([
      {
        label: 'Mediciones',
        href: '/app/aquariums/measurements',
      },
      {
        label: 'Observaciones',
        href: '/app/aquariums/observations',
      },
      {
        label: 'Cuidados realizados',
        href: '/app/aquariums/care',
      },
      {
        label: 'Cambios de agua',
        href: '/app/aquariums/maintenance',
      },
      {
        label: 'Historial de habitantes',
        href: '/app/aquariums/livestock/history',
      },
    ]);
  });

  it('shows an actionable empty state', async () => {
    execute.mockResolvedValue([]);
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('.empty-state')?.textContent).toContain(
      'No hay actividad reciente',
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

  it('shows a recoverable error', async () => {
    execute.mockRejectedValue(new Error('offline'));
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se ha podido cargar la actividad reciente',
    );
  });
});
