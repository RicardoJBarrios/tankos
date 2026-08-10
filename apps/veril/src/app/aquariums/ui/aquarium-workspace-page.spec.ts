import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AquariumListItem } from '../application/aquarium-ports';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../application/active-aquarium-context-storage';
import { ListMyAquariums } from '../application/list-my-aquariums';
import { ListPlannedCareWork } from '../application/list-planned-care-work';
import { ReviewCurrentMeasurements } from '../application/review-current-measurements';
import { ReviewRecentTimeline } from '../application/review-recent-timeline';
import {
  AquariumName,
  aquariumIdFrom,
  aquariumTimeZoneFrom,
} from '../domain/aquarium';
import { CurrentMeasurementsSection } from './current-measurements-section';
import { RecentActivityPreview } from './recent-activity-preview';
import { UpcomingCarePreview } from './upcoming-care-preview';
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
      [
        CurrentMeasurementsSection,
        {
          set: {
            providers: [
              {
                provide: ReviewCurrentMeasurements,
                useValue: { execute: vi.fn().mockResolvedValue([]) },
              },
            ],
          },
        },
      ],
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
    execute.mockResolvedValue([aquarium]);
    const spectator: Spectator<AquariumWorkspacePage> = createComponent();
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
    execute.mockResolvedValue([
      { ...aquarium, timeZone: aquariumTimeZoneFrom('Atlantic/Canary') },
    ]);
    const spectator = createComponent();
    await new Promise((resolve) => setTimeout(resolve, 0));
    spectator.detectChanges();

    expect(
      spectator.query('[data-testid="aquarium-time-zone"]')?.textContent,
    ).toContain('Atlantic/Canary');
    expect(spectator.query('[data-testid="aquarium-time-zone"] a')).toBeFalsy();
  });
});
