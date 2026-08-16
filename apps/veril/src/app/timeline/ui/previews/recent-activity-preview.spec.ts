import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../../shared/application/active-aquarium-context-storage';
import {
  CareWorkTimelineItem,
  MeasurementTimelineItem,
  ObservationTimelineItem,
  ReviewRecentTimeline,
} from '../../application/review-recent-timeline';
import {
  aquariumIdFrom,
  aquariumTimeZoneFrom,
} from '../../../shared/domain/aquarium-reference';
import { RecentActivityPreview } from './recent-activity-preview';

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
  description: 'Limpié el skimmer',
  effectiveAt: new Date('2026-08-08T08:00:00.000Z'),
  performedAt: new Date('2026-08-08T08:00:00.000Z'),
  recordedAt: new Date('2026-08-08T08:00:00.000Z'),
};

describe('RecentActivityPreview', () => {
  const execute = vi.fn();
  let includeActiveContext = true;

  const createComponent = createComponentFactory({
    component: RecentActivityPreview,
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
        RecentActivityPreview,
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

  async function settle(spectator: Spectator<RecentActivityPreview>) {
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  it('does not query without Active Context and offers recovery', () => {
    includeActiveContext = false;
    const spectator = createComponent();

    expect(execute).not.toHaveBeenCalled();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
    expect(spectator.query('a')?.getAttribute('href')).toBe('/app/aquariums');
  });

  it('shows loading while the read is pending', async () => {
    let resolvePending!: (items: readonly never[]) => void;
    execute.mockImplementation(
      () => new Promise((resolve) => (resolvePending = resolve)),
    );
    const spectator = createComponent();

    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Cargando actividad reciente',
    );

    resolvePending([]);
    await settle(spectator);
  });

  it('renders at most three recent items and links to full activity', async () => {
    execute.mockResolvedValue([observation, measurement, careWork]);
    const spectator = createComponent();
    spectator.component.timeZone = aquariumTimeZoneFrom('Atlantic/Canary');
    await settle(spectator);

    expect(spectator.queryAll('li')).toHaveLength(3);
    expect(
      spectator.query('[data-testid="recent-activity-preview"]')?.textContent,
    ).toContain('El coral está abierto');
    expect(
      spectator.query('[data-testid="recent-activity-preview"]')?.textContent,
    ).toContain('23.5 °C');
    expect(spectator.queryAll('time')[0]?.textContent).toContain('11:00');
    expect(
      spectator.query('a[href="/app/aquariums/timeline"]')?.textContent,
    ).toContain('Ver toda la actividad');
    expect(execute).toHaveBeenCalledWith(3);
  });

  it('shows an actionable empty state', async () => {
    execute.mockResolvedValue([]);
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('.empty-state')?.textContent).toContain(
      'No hay actividad reciente',
    );
    expect(
      spectator.query('a[href="/app/aquariums/observations/new"]'),
    ).not.toBeNull();
  });

  it('shows a recoverable error', async () => {
    execute.mockRejectedValue(new Error('offline'));
    const spectator = createComponent();
    await settle(spectator);

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se ha podido cargar la actividad reciente',
    );
    expect(spectator.query('button')?.textContent).toContain('Reintentar');
  });
});
