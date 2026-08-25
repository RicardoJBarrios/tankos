import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../../shared/application/active-aquarium-context-storage';
import { PlanCareWork } from '../../application/plan-care-work';
import { aquariumIdFrom } from '../../../shared/domain/aquarium-reference';
import { PlanCareWorkPage } from './plan-care-work-page';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

describe('PlanCareWorkPage', () => {
  const execute = vi.fn();
  let includeActiveContext = false;
  const createComponent = createComponentFactory({
    component: PlanCareWorkPage,
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
        PlanCareWorkPage,
        {
          set: {
            providers: [{ provide: PlanCareWork, useValue: { execute } }],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset();
    includeActiveContext = false;
  });

  it('hides the form without Active Context', () => {
    const spectator = createComponent();

    expect(spectator.query('form')).toBeNull();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
  });

  it('validates and submits a planned intention', async () => {
    includeActiveContext = true;
    execute.mockResolvedValue(undefined);
    const spectator: Spectator<PlanCareWorkPage> = createComponent();

    await spectator.click('button');
    spectator.detectChanges();
    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'Describe el cuidado planificado',
    );

    spectator.typeInElement(
      'Limpiar el skimmer',
      '#planned-care-work-description',
    );
    await spectator.click('button');
    spectator.detectChanges();

    expect(execute).toHaveBeenCalledWith(
      'Limpiar el skimmer',
      expect.any(Date),
    );
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'planificado correctamente',
    );
    expect(
      spectator.query('a[href="/app/aquariums/care/planned"]'),
    ).not.toBeNull();
  });

  it('shows the pending state', async () => {
    includeActiveContext = true;
    let resolveSave!: () => void;
    execute.mockImplementation(
      () => new Promise<void>((resolve) => (resolveSave = resolve)),
    );
    const spectator = createComponent();
    spectator.typeInElement('Limpieza', '#planned-care-work-description');
    const submit = spectator.click('button');
    spectator.detectChanges();
    expect(spectator.query('button')?.textContent).toContain('Guardando');
    expect(spectator.query('button')?.hasAttribute('disabled')).toBe(true);
    resolveSave();
    await submit;
  });

  it('shows recoverable failures', async () => {
    includeActiveContext = true;
    execute.mockRejectedValue(new Error('offline'));
    const failed: Spectator<PlanCareWorkPage> = createComponent();
    failed.typeInElement('Limpieza', '#planned-care-work-description');
    await failed.click('form button[type="submit"]');
    failed.detectChanges();
    expect(failed.query('[role="alert"]')?.textContent).toContain(
      'No se ha podido planificar',
    );
  });
});
