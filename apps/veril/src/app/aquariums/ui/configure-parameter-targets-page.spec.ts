import { signal } from '@angular/core';
import { createComponentFactory } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ParameterTargets } from '../domain/aquarium';
import { ConfigureParameterTargetsPage } from './configure-parameter-targets-page';
import { AquariumWorkspaceStore } from './aquarium-workspace-store';

describe('ConfigureParameterTargetsPage', () => {
  const status = signal<'loading' | 'ready' | 'no-context' | 'failure'>(
    'ready',
  );
  const targets = signal<ParameterTargets>({});
  const load = vi.fn();
  const saveTarget = vi.fn();
  const removeTarget = vi.fn();
  const workspace = {
    status,
    load,
    targetFor: (parameterId: keyof ParameterTargets) => targets()[parameterId],
    hasTarget: (parameterId: keyof ParameterTargets) =>
      targets()[parameterId] !== undefined,
    saveTarget,
    removeTarget,
  };

  const createComponent = createComponentFactory({
    component: ConfigureParameterTargetsPage,
    providers: [
      provideRouter([]),
      { provide: AquariumWorkspaceStore, useValue: workspace },
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
    status.set('ready');
    targets.set({});
    load.mockReset();
    saveTarget.mockReset();
    removeTarget.mockReset();
  });

  it('lists the five canonical Parameters with neutral unconfigured states', () => {
    const spectator = createComponent();

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

  it('shows an existing interval and lets the keeper edit it', () => {
    targets.set({
      temperature: { parameterId: 'temperature', minimum: 24, maximum: 25 },
    });
    const spectator = createComponent();

    expect(
      spectator.query('[data-testid="configured-parameter-target"]')
        ?.textContent,
    ).toContain('24 – 25 °C');
    spectator.click(buttonNamed(spectator, 'Editar objetivo'));
    expect(spectator.query('form')).toBeTruthy();
  });

  it('validates the ordered interval before saving', async () => {
    const spectator = createComponent();
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

  it('saves and removes through the Workspace Store', async () => {
    saveTarget.mockResolvedValue({
      parameterId: 'temperature',
      minimum: 24,
      maximum: 25,
    });
    targets.set({
      temperature: { parameterId: 'temperature', minimum: 24, maximum: 25 },
    });
    const spectator = createComponent();

    spectator.click(buttonNamed(spectator, 'Eliminar objetivo'));

    expect(removeTarget).toHaveBeenCalledWith('temperature');
  });

  it('explains the no-context recovery state', () => {
    status.set('no-context');
    const spectator = createComponent();

    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
  });
});
