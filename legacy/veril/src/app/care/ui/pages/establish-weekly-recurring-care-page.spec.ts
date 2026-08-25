import { createComponentFactory } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../../shared/application/active-aquarium-context-storage';
import { EstablishWeeklyRecurringCare } from '../../application/establish-weekly-recurring-care';
import { CARE_AQUARIUM_CONTEXT_READER, KEEPER_SESSION } from '../providers';
import { EstablishWeeklyRecurringCarePage } from './establish-weekly-recurring-care-page';

describe('EstablishWeeklyRecurringCarePage', () => {
  const execute = vi.fn();
  let includeContext = false;
  const createComponent = createComponentFactory({
    component: EstablishWeeklyRecurringCarePage,
    providers: [
      provideRouter([]),
      {
        provide: ActiveAquariumContext,
        useFactory: () => {
          const context = new ActiveAquariumContext({
            load: vi.fn(),
            save: vi.fn(),
            clear: vi.fn(),
          } satisfies ActiveAquariumContextStorage);
          if (includeContext) {
            context.select('123e4567-e89b-42d3-a456-426614174000' as never);
          }
          return context;
        },
      },
    ],
    overrideComponents: [
      [
        EstablishWeeklyRecurringCarePage,
        {
          set: {
            providers: [
              { provide: EstablishWeeklyRecurringCare, useValue: { execute } },
              {
                provide: KEEPER_SESSION,
                useValue: { requireAuthenticatedKeeper: vi.fn() },
              },
              {
                provide: CARE_AQUARIUM_CONTEXT_READER,
                useValue: { getOwned: vi.fn() },
              },
            ],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset();
    includeContext = false;
  });

  it('explains that an Aquarium must be selected before showing the form', () => {
    const spectator = createComponent();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
    expect(execute).not.toHaveBeenCalled();
  });
});
