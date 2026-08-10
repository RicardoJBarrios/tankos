import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrentParameterState } from '../application/parameter-status';
import { aquariumTimeZoneFrom } from '../domain/aquarium';
import { AquariumWorkspaceStore } from './aquarium-workspace-store';
import { CurrentMeasurementsSection } from './current-measurements-section';

describe('CurrentMeasurementsSection', () => {
  const loadCurrentMeasurements = vi.fn();
  const currentMeasurementsLoading = signal(false);
  const currentMeasurementsError = signal(false);
  const currentParameterStates = signal<readonly CurrentParameterState[]>([]);

  const workspace = {
    currentMeasurementsLoading,
    currentMeasurementsError,
    currentParameterStates,
    loadCurrentMeasurements,
  };

  const createComponent = createComponentFactory({
    component: CurrentMeasurementsSection,
    providers: [
      provideRouter([]),
      { provide: AquariumWorkspaceStore, useValue: workspace },
    ],
  });

  beforeEach(() => {
    currentMeasurementsLoading.set(false);
    currentMeasurementsError.set(false);
    currentParameterStates.set([]);
    loadCurrentMeasurements.mockReset();
  });

  function temperatureState(
    interpretation: CurrentParameterState['interpretation'] = 'within',
  ): CurrentParameterState {
    return {
      parameterId: 'temperature',
      measurement: {
        parameterId: 'temperature',
        canonicalValue: 25.4,
        canonicalUnit: 'celsius',
        measuredAt: new Date('2026-08-09T10:00:00.000Z'),
      },
      target: { parameterId: 'temperature', minimum: 24, maximum: 26 },
      interpretation,
    };
  }

  async function settle(spectator: Spectator<CurrentMeasurementsSection>) {
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  it('shows loading while current values are pending', () => {
    currentMeasurementsLoading.set(true);
    const spectator = createComponent();

    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Cargando últimas mediciones',
    );
  });

  it('shows values, target status, canonical unit and age', async () => {
    currentParameterStates.set([temperatureState()]);
    const spectator = createComponent();
    spectator.component.now.set(new Date('2026-08-10T12:00:00.000Z'));
    spectator.component.timeZone = aquariumTimeZoneFrom('Atlantic/Canary');
    await settle(spectator);

    const section = spectator.query('[data-testid="current-measurements"]');
    expect(section?.textContent).toContain('25.4 °C');
    expect(section?.textContent).toContain('Objetivo: 24–26 °C');
    expect(section?.textContent).toContain('Dentro del objetivo');
    expect(section?.textContent).toContain('11:00');
    expect(section?.textContent).toContain('Hace 1 día');
  });

  it.each([
    ['below', 'Por debajo del objetivo'],
    ['above', 'Por encima del objetivo'],
  ] as const)(
    'shows the %s status explicitly',
    async (interpretation, text) => {
      currentParameterStates.set([temperatureState(interpretation)]);
      const spectator = createComponent();

      await settle(spectator);

      expect(
        spectator.query('[data-testid="current-measurements"]')?.textContent,
      ).toContain(text);
    },
  );

  it('shows no target, missing data and a navigation action', async () => {
    currentParameterStates.set([
      { ...temperatureState(undefined), measurement: null, target: undefined },
    ]);
    const spectator = createComponent();

    await settle(spectator);

    expect(
      spectator.query('[data-testid="current-measurements"]')?.textContent,
    ).toContain('Sin datos');
    expect(
      spectator.query('[data-testid="current-measurements"]')?.textContent,
    ).toContain('Configurar objetivo');
    expect(spectator.query('a')?.getAttribute('href')).toBe(
      '/app/aquariums/parameter-targets',
    );
  });

  it('shows a recoverable error and retries through the Store', () => {
    currentMeasurementsError.set(true);
    const spectator = createComponent();

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se han podido cargar las últimas mediciones',
    );
    spectator.click('button');
    expect(loadCurrentMeasurements).toHaveBeenCalledOnce();
  });
});
