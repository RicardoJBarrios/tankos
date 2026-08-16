import { provideRouter } from '@angular/router';
import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrentParameterState } from '../../application/parameter-status';
import { aquariumTimeZoneFrom } from '../../../shared/domain/aquarium-reference';
import { CurrentMeasurementsSection } from './current-measurements-section';

describe('CurrentMeasurementsSection', () => {
  const createComponent = createComponentFactory({
    component: CurrentMeasurementsSection,
    providers: [provideRouter([])],
  });

  beforeEach(() => vi.restoreAllMocks());

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
    const spectator = createComponent();
    spectator.setInput('loading', true);

    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Cargando últimas mediciones',
    );
  });

  it('shows values, target status, canonical unit and age', async () => {
    const spectator = createComponent();
    spectator.setInput('states', [temperatureState()]);
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
      const spectator = createComponent();
      spectator.setInput('states', [temperatureState(interpretation)]);

      await settle(spectator);

      expect(
        spectator.query('[data-testid="current-measurements"]')?.textContent,
      ).toContain(text);
    },
  );

  it('shows no target, missing data and a navigation action', async () => {
    const spectator = createComponent();
    spectator.setInput('states', [
      { ...temperatureState(undefined), measurement: null, target: undefined },
    ]);

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

  it('shows a recoverable error and requests a retry', () => {
    const spectator = createComponent();
    const retryRequested = vi.fn();
    spectator.component.retryRequested.subscribe(retryRequested);
    spectator.setInput('loadFailed', true);

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se han podido cargar las últimas mediciones',
    );
    spectator.click('button');
    expect(retryRequested).toHaveBeenCalledOnce();
  });
});
