import { createComponentFactory } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../../shared/application/active-aquarium-context-storage';
import { CancelPlannedCareWork } from '../../application/cancel-planned-care-work';
import { CompletePlannedCareWork } from '../../application/complete-planned-care-work';
import { ListPlannedCareWork } from '../../application/list-planned-care-work';
import { StopRecurringCarePlan } from '../../application/stop-recurring-care-plan';
import {
  aquariumIdFrom,
  aquariumTimeZoneFrom,
} from '../../../shared/domain/aquarium-reference';
import { ListPlannedCareWorkPage } from './list-planned-care-work-page';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const item = {
  id: '123e4567-e89b-42d3-a456-426614174001' as never,
  description: 'Limpiar el skimmer',
  plannedFor: new Date('2026-08-12T10:00:00.000Z'),
  recordedAt: new Date('2026-08-09T10:00:00.000Z'),
  provenance: 'manual' as const,
};

describe('ListPlannedCareWorkPage', () => {
  const execute = vi.fn();
  const complete = vi.fn();
  const cancel = vi.fn();
  const stop = vi.fn();
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
              { provide: CancelPlannedCareWork, useValue: { execute: cancel } },
              { provide: StopRecurringCarePlan, useValue: { execute: stop } },
            ],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset();
    complete.mockReset();
    cancel.mockReset();
    stop.mockReset();
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
    execute.mockResolvedValueOnce({ items: [] });
    const empty = createComponent();
    await empty.fixture.whenStable();
    empty.detectChanges();
    expect(empty.query('.empty-state')?.textContent).toContain(
      'No hay cuidados planificados',
    );

    execute.mockResolvedValueOnce({ items: [item] });
    const populated = createComponent();
    populated.component.now.set(new Date('2026-08-10T10:00:00.000Z'));
    populated.component.timeZone.set(aquariumTimeZoneFrom('Atlantic/Canary'));
    await populated.fixture.whenStable();
    populated.detectChanges();
    expect(
      populated.query('[data-testid="planned-care-work-list"]')?.textContent,
    ).toContain('Limpiar el skimmer');
    expect(populated.query('time')?.textContent).toContain('Previsto para');
    expect(populated.query('.care-timing')?.textContent).toContain('Pendiente');
    expect(populated.query('time')?.textContent).toContain('11:00');
  });

  it('shows overdue text for a past plan', async () => {
    const overdue = {
      ...item,
      plannedFor: new Date('2026-08-08T10:00:00.000Z'),
    };
    execute.mockResolvedValue({ items: [overdue] });
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.component.now.set(new Date('2026-08-10T10:00:00.000Z'));
    spectator.detectChanges();

    expect(spectator.query('.care-timing')?.textContent).toContain('Vencido');
    expect(spectator.query('time')?.getAttribute('datetime')).toBe(
      '2026-08-08T10:00:00.000Z',
    );
  });

  it('puts overdue plans before upcoming plans', async () => {
    const upcoming = {
      ...item,
      id: '123e4567-e89b-42d3-a456-426614174002' as never,
      description: 'Comprobar temperatura',
      plannedFor: new Date('2026-08-11T10:00:00.000Z'),
    };
    const overdue = {
      ...item,
      description: 'Limpiar el skimmer hoy',
      plannedFor: new Date('2026-08-08T10:00:00.000Z'),
    };
    execute.mockResolvedValue({ items: [upcoming, overdue] });
    const spectator = createComponent();
    spectator.component.now.set(new Date('2026-08-10T10:00:00.000Z'));
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(
      spectator
        .queryAll('.care-work-description')
        .map((element) => element.textContent?.trim()),
    ).toEqual(['Limpiar el skimmer hoy', 'Comprobar temperatura']);
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
    execute.mockResolvedValue({ items: [item] });
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
    execute.mockResolvedValue({ items: [item] });
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    await spectator.click(spectator.query('button') as HTMLButtonElement);
    spectator.detectChanges();
    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se ha podido completar',
    );
  });

  it('confirms cancellation, shows pending and removes the plan', async () => {
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(true);
    execute.mockResolvedValue({ items: [item] });
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    let resolveCancellation!: () => void;
    cancel.mockImplementation(
      () => new Promise<void>((resolve) => (resolveCancellation = resolve)),
    );
    const button = spectator.query(
      'button[aria-label^="Cancelar"]',
    ) as HTMLButtonElement;
    const cancellation = spectator.click(button);
    spectator.detectChanges();
    expect(confirmation).toHaveBeenCalledWith(
      '¿Cancelar "Limpiar el skimmer"?',
    );
    expect(cancel).toHaveBeenCalledWith(item.id);
    expect(button.textContent).toContain('Cancelando');
    expect(button.hasAttribute('disabled')).toBe(true);
    resolveCancellation();
    await cancellation;
    spectator.detectChanges();
    expect(spectator.query('.empty-state')?.textContent).toContain(
      'No hay cuidados planificados',
    );
    confirmation.mockRestore();
  });

  it('keeps the plan and reports cancellation failures', async () => {
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(true);
    cancel.mockRejectedValue(new Error('offline'));
    execute.mockResolvedValue({ items: [item] });
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    await spectator.click(
      spectator.query('button[aria-label^="Cancelar"]') as HTMLButtonElement,
    );
    spectator.detectChanges();
    expect(spectator.query('.care-work-description')?.textContent).toContain(
      'Limpiar el skimmer',
    );
    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se ha podido cancelar',
    );
    confirmation.mockRestore();
  });

  it('does not cancel when confirmation is declined', async () => {
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(false);
    execute.mockResolvedValue({ items: [item] });
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    await spectator.click(
      spectator.query('button[aria-label^="Cancelar"]') as HTMLButtonElement,
    );
    expect(cancel).not.toHaveBeenCalled();
    confirmation.mockRestore();
  });
});
