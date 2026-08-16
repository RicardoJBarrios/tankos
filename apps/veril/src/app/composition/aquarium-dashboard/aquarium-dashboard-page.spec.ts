import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AquariumDashboardContext } from '../../aquarium-management/application/ports';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../shared/application/active-aquarium-context-storage';
import { ReadAquariumDashboardContext } from '../../aquarium-management/application/read-aquarium-dashboard-context';
import { ListPlannedCareWork } from '../../care/application/list-planned-care-work';
import { ReviewCurrentMeasurements } from '../../measurements/application/review-current-measurements';
import { ReviewRecentTimeline } from '../../timeline/application/review-recent-timeline';
import {
  AquariumName,
  aquariumIdFrom,
  aquariumTimeZoneFrom,
} from '../../aquarium-management/domain/aquarium';
import { CurrentMeasurementsSection } from '../../measurements/ui/sections/current-measurements-section';
import { RecentActivityPreview } from '../../timeline/ui/previews/recent-activity-preview';
import { UpcomingCarePreview } from '../../care/ui/previews/upcoming-care-preview';
import { AquariumDashboardStore } from './aquarium-dashboard-store';
import { AquariumDashboardPage } from './aquarium-dashboard-page';

const activeId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const aquarium: AquariumDashboardContext = {
  id: activeId,
  name: AquariumName.create('Veril'),
  parameterTargets: {},
};

describe('AquariumDashboardPage', () => {
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
    component: AquariumDashboardPage,
    providers: [provideRouter([])],
    overrideComponents: [
      [
        AquariumDashboardPage,
        {
          set: {
            providers: [
              { provide: ReadAquariumDashboardContext, useValue: { execute } },
              {
                provide: ReviewCurrentMeasurements,
                useValue: { execute: vi.fn().mockResolvedValue([]) },
              },
              {
                provide: ActiveAquariumContext,
                useFactory: () => createContext(contextSelected),
              },
              AquariumDashboardStore,
            ],
          },
        },
      ],
      [CurrentMeasurementsSection, { set: { providers: [] } }],
      [
        RecentActivityPreview,
        {
          set: {
            providers: [
              {
                provide: ReviewRecentTimeline,
                useValue: { execute: vi.fn().mockResolvedValue([]) },
              },
            ],
          },
        },
      ],
      [
        UpcomingCarePreview,
        {
          set: {
            providers: [
              {
                provide: ListPlannedCareWork,
                useValue: { execute: vi.fn().mockResolvedValue([]) },
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
    execute.mockResolvedValue(aquarium);
    const spectator: Spectator<AquariumDashboardPage> = createComponent();
    await new Promise((resolve) => setTimeout(resolve, 0));
    spectator.detectChanges();

    expect(spectator.query('h2')?.textContent).toContain('Veril');
    expect(
      spectator.query('[data-testid="aquarium-time-zone-missing"]'),
    ).toBeTruthy();
    expect(
      spectator.queryAll('h3').map((heading) => heading.textContent),
    ).toEqual([
      'Últimas mediciones',
      'Actividad reciente',
      'Cuidados pendientes',
      'Configurar',
      'Registrar',
      'Consultar',
    ]);
    expect(
      spectator.queryAll('a').map((link) => link.textContent?.trim()),
    ).toEqual(
      expect.arrayContaining([
        'Registrar observación',
        'Ver toda la actividad',
      ]),
    );
  });

  it('shows the configured timezone without offering configuration', async () => {
    contextSelected = true;
    execute.mockResolvedValue({
      ...aquarium,
      timeZone: aquariumTimeZoneFrom('Atlantic/Canary'),
    });
    const spectator = createComponent();
    await new Promise((resolve) => setTimeout(resolve, 0));
    spectator.detectChanges();

    expect(
      spectator.query('[data-testid="aquarium-time-zone"]')?.textContent,
    ).toContain('Atlantic/Canary');
    expect(spectator.query('[data-testid="aquarium-time-zone"] a')).toBeFalsy();
  });
});
