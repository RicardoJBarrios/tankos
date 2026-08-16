import { createComponentFactory } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigureParameterTargetsPage } from './configure-parameter-targets-page';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ReadAquariumDashboardContext } from '../../application/read-aquarium-dashboard-context';
import { SaveParameterTarget } from '../../application/save-parameter-target';
import { RemoveParameterTarget } from '../../application/remove-parameter-target';

describe('ConfigureParameterTargetsPage', () => {
  const activeAquarium = vi.fn();
  const readDashboard = vi.fn();
  const saveTarget = vi.fn();
  const removeTarget = vi.fn();

  const createComponent = createComponentFactory({
    component: ConfigureParameterTargetsPage,
    providers: [
      provideRouter([]),
      { provide: ActiveAquariumContext, useValue: { get: activeAquarium } },
      {
        provide: ReadAquariumDashboardContext,
        useValue: { execute: readDashboard },
      },
      { provide: SaveParameterTarget, useValue: { execute: saveTarget } },
      { provide: RemoveParameterTarget, useValue: { execute: removeTarget } },
    ],
  });

  function buttonNamed(
    spectator: ReturnType<typeof createComponent>,
    name: string,
  ): HTMLButtonElement {
    const button = spectator
      .queryAll<HTMLButtonElement>('button')
      .find((candidate) => candidate.textContent?.trim() === name);
    if (!button) {
      throw new Error(`Expected button ${name}.`);
    }
    return button;
  }

  beforeEach(() => {
    activeAquarium.mockReset().mockReturnValue('aquarium-id');
    readDashboard.mockReset().mockResolvedValue({ parameterTargets: {} });
    saveTarget.mockReset();
    removeTarget.mockReset();
  });

  it('lists the five canonical Parameters with neutral unconfigured states', async () => {
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(
      spectator.queryAll('.target h3').map((item) => item.textContent),
    ).toEqual([
      'Temperatura',
      'Salinidad',
      'Alcalinidad',
      'Nitrato',
      'Fosfato',
    ]);
    expect(spectator.queryAll('p').map((item) => item.textContent)).toContain(
      'Sin objetivo configurado',
    );
    expect(spectator.query('form')).toBeFalsy();
  });

  it('shows an existing interval and lets the keeper edit it', async () => {
    readDashboard.mockResolvedValue({
      parameterTargets: {
        temperature: { parameterId: 'temperature', minimum: 24, maximum: 25 },
      },
    });
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(
      spectator.query('[data-testid="configured-parameter-target"]')
        ?.textContent,
    ).toContain('24 – 25 °C');
    spectator.click(buttonNamed(spectator, 'Editar objetivo'));
    expect(spectator.query('form')).toBeTruthy();
  });

  it('validates the ordered interval before saving', async () => {
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
    spectator.click(buttonNamed(spectator, 'Configurar objetivo'));
    const inputs = spectator.queryAll<HTMLInputElement>('input[type="number"]');
    spectator.typeInElement('26', inputs[0]);
    spectator.typeInElement('25', inputs[1]);
    spectator.click(buttonNamed(spectator, 'Guardar objetivo'));

    expect(saveTarget).not.toHaveBeenCalled();
    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'mínimo no puede ser mayor',
    );
  });

  it('removes through the Aquarium target use case', async () => {
    saveTarget.mockResolvedValue({
      parameterId: 'temperature',
      minimum: 24,
      maximum: 25,
    });
    readDashboard.mockResolvedValue({
      parameterTargets: {
        temperature: { parameterId: 'temperature', minimum: 24, maximum: 25 },
      },
    });
    const spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    spectator.click(buttonNamed(spectator, 'Eliminar objetivo'));

    expect(removeTarget).toHaveBeenCalledWith('temperature');
  });

  it('explains the no-context recovery state', () => {
    activeAquarium.mockReturnValue(undefined);
    const spectator = createComponent();

    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
  });
});
