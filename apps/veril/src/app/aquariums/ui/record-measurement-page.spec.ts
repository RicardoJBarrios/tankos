import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { RecordMeasurement } from '../application/record-measurement';
import { aquariumIdFrom } from '../domain/aquarium';
import { RecordMeasurementPage } from './record-measurement-page';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

describe('RecordMeasurementPage', () => {
  const execute = vi.fn();
  let includeActiveContext = false;
  const createComponent = createComponentFactory({
    component: RecordMeasurementPage,
    providers: [
      {
        provide: ActiveAquariumContext,
        useFactory: () => {
          const context = new ActiveAquariumContext();
          if (includeActiveContext) {
            context.select(aquariumId);
          }
          return context;
        },
      },
    ],
    overrideComponents: [
      [
        RecordMeasurementPage,
        {
          set: {
            providers: [{ provide: RecordMeasurement, useValue: { execute } }],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset();
    includeActiveContext = false;
  });

  it('does not show the form without an active Aquarium', () => {
    const spectator: Spectator<RecordMeasurementPage> = createComponent();

    expect(spectator.query('form')).toBeNull();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
    expect(spectator.query('a')?.getAttribute('href')).toBe('/app/aquariums');
    expect(execute).not.toHaveBeenCalled();
  });

  it('selects a Parameter and submits its canonical unit', async () => {
    includeActiveContext = true;
    execute.mockResolvedValue(undefined);
    const spectator: Spectator<RecordMeasurementPage> = createComponent();

    spectator.selectOption('select', 'salinity');
    spectator.detectChanges();
    expect(spectator.query('#measurement-unit')?.textContent).toContain('ppt');
    spectator.typeInElement('35', '#measurement-value');
    await spectator.click('button');
    spectator.detectChanges();

    expect(execute).toHaveBeenCalledWith('salinity', 35, expect.any(Date));
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'guardada correctamente',
    );
  });

  it('validates a missing value accessibly', async () => {
    includeActiveContext = true;
    const spectator: Spectator<RecordMeasurementPage> = createComponent();

    await spectator.click('button');
    spectator.detectChanges();

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'Escribe un valor válido',
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it('shows a recoverable error when saving fails', async () => {
    includeActiveContext = true;
    execute.mockRejectedValue(new Error('offline'));
    const spectator: Spectator<RecordMeasurementPage> = createComponent();

    spectator.typeInElement('23.5', '#measurement-value');
    await spectator.click('button');
    spectator.detectChanges();

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se ha podido guardar la medición',
    );
  });

  it('exposes the pending state while saving', async () => {
    includeActiveContext = true;
    let resolveSave!: () => void;
    execute.mockImplementation(
      () => new Promise<void>((resolve) => (resolveSave = resolve)),
    );
    const spectator: Spectator<RecordMeasurementPage> = createComponent();

    spectator.typeInElement('23.5', '#measurement-value');
    const submit = spectator.click('button');
    spectator.detectChanges();

    expect(spectator.query('button')?.hasAttribute('disabled')).toBe(true);
    expect(spectator.query('button')?.textContent).toContain('Guardando');

    resolveSave();
    await submit;
  });
});
