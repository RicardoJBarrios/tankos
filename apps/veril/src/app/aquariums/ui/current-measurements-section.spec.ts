import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewCurrentMeasurements } from '../application/review-current-measurements';
import { aquariumTimeZoneFrom } from '../domain/aquarium';
import { CurrentMeasurementsSection } from './current-measurements-section';

describe('CurrentMeasurementsSection', () => {
  const execute = vi.fn();
  const createComponent = createComponentFactory({
    component: CurrentMeasurementsSection,
    overrideComponents: [
      [
        CurrentMeasurementsSection,
        {
          set: {
            providers: [
              { provide: ReviewCurrentMeasurements, useValue: { execute } },
            ],
          },
        },
      ],
    ],
  });

  beforeEach(() => execute.mockReset());

  async function settle(spectator: Spectator<CurrentMeasurementsSection>) {
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  it('shows loading while the current values are pending', () => {
    let resolve!: (values: readonly unknown[]) => void;
    execute.mockReturnValue(new Promise((done) => (resolve = done)));
    const spectator = createComponent();

    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Cargando últimas mediciones',
    );
    resolve([]);
  });

  it('shows values and missing Parameters honestly', async () => {
    execute.mockResolvedValue([
      {
        parameterId: 'temperature',
        canonicalValue: 25.4,
        canonicalUnit: 'celsius',
        measuredAt: new Date('2026-08-09T10:00:00.000Z'),
      },
      {
        parameterId: 'salinity',
        canonicalValue: null,
        canonicalUnit: null,
        measuredAt: null,
      },
    ]);
    const spectator = createComponent();
    spectator.component.timeZone = aquariumTimeZoneFrom('Atlantic/Canary');
    await settle(spectator);

    expect(
      spectator.query('[data-testid="current-measurements"]')?.textContent,
    ).toContain('25.4 °C');
    expect(
      spectator.query('[data-testid="current-measurements"]')?.textContent,
    ).toContain('Salinidad');
    expect(
      spectator.query('[data-testid="current-measurements"]')?.textContent,
    ).toContain('Sin datos');
    expect(spectator.query('time')?.textContent).toContain('11:00');
  });

  it('shows a recoverable error', () => {
    let resolve!: (values: readonly unknown[]) => void;
    execute.mockReturnValue(new Promise((done) => (resolve = done)));
    const spectator = createComponent();
    spectator.component.state.set('failure');
    spectator.detectChanges();

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se han podido cargar las últimas mediciones',
    );
    resolve([]);
  });
});
