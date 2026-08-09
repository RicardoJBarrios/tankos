import { createComponentFactory } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../application/active-aquarium-context-storage';
import { CompletePlannedCareWork } from '../application/complete-planned-care-work';
import { ListPlannedCareWork } from '../application/list-planned-care-work';
import { aquariumIdFrom } from '../domain/aquarium';
import { ListPlannedCareWorkPage } from './list-planned-care-work-page';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const item = {
  id: '123e4567-e89b-42d3-a456-426614174001' as never,
  description: 'Limpiar el skimmer',
  plannedFor: new Date('2026-08-10T10:00:00.000Z'),
  recordedAt: new Date('2026-08-09T10:00:00.000Z'),
};

describe('ListPlannedCareWorkPage', () => {
  const execute = vi.fn();
  const complete = vi.fn();
  let includeActiveContext = true;
  const createComponent = createComponentFactory({
    component: ListPlannedCareWorkPage,
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
        ListPlannedCareWorkPage,
        {
          set: {
            providers: [
              { provide: ListPlannedCareWork, useValue: { execute } },
              {
                provide: CompletePlannedCareWork,
                useValue: { execute: complete },
              },
            ],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset();
    complete.mockReset();
    includeActiveContext = true;
  });

  it('shows recovery without Active Context', () => {
    includeActiveContext = false;
    const spectator = createComponent();
    expect(execute).not.toHaveBeenCalled();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
  });

  it('renders the empty state and a planned intention', async () => {
    execute.mockResolvedValueOnce([]);
    const empty = createComponent();
    await empty.fixture.whenStable();
    empty.detectChanges();
    expect(empty.query('.empty-state')?.textContent).toContain(
      'No hay cuidados planificados',
    );

    execute.mockResolvedValueOnce([item]);
    const populated = createComponent();
    await populated.fixture.whenStable();
    populated.detectChanges();
    expect(
      populated.query('[data-testid="planned-care-work-list"]')?.textContent,
    ).toContain('Limpiar el skimmer');
    expect(populated.query('time')?.textContent).toContain('Previsto para');
  });

  it('shows recoverable failures', async () => {
    execute.mockRejectedValue(new Error('offline'));
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se han podido cargar',
    );
  });

  it('completes an intention, shows pending and removes it from the list', async () => {
    complete.mockResolvedValue({});
    execute.mockResolvedValue([item]);
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    const button = spectator.query('button') as HTMLButtonElement;
    let resolveCompletion!: () => void;
    complete.mockImplementation(
      () => new Promise<void>((resolve) => (resolveCompletion = resolve)),
    );
    const pending = spectator.click(button);
    spectator.detectChanges();
    expect(button.textContent).toContain('Completando');
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(complete).toHaveBeenCalledWith(item.id);
    resolveCompletion();
    await pending;
  });

  it('shows a recoverable completion error', async () => {
    complete.mockRejectedValue(new Error('offline'));
    execute.mockResolvedValue([item]);
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    await spectator.click(spectator.query('button') as HTMLButtonElement);
    spectator.detectChanges();
    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se ha podido completar',
    );
  });
});
