import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../../shared/application/active-aquarium-context-storage';
import { RecordObservation } from '../../application/record-observation';
import { aquariumIdFrom } from '../../../shared/domain/aquarium-reference';
import { RecordObservationPage } from './record-observation-page';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

describe('RecordObservationPage', () => {
  const execute = vi.fn();
  let includeActiveContext = false;
  const createComponent = createComponentFactory({
    component: RecordObservationPage,
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
          if (includeActiveContext) {
            context.select(aquariumId);
          }
          return context;
        },
      },
    ],
    overrideComponents: [
      [
        RecordObservationPage,
        {
          set: {
            providers: [{ provide: RecordObservation, useValue: { execute } }],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    execute.mockReset();
    includeActiveContext = false;
  });

  it('validates empty content accessibly', async () => {
    includeActiveContext = true;
    const spectator: Spectator<RecordObservationPage> = createComponent();

    await spectator.click('button');
    spectator.detectChanges();

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'Escribe una observación',
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it('submits a qualitative observation and confirms success', async () => {
    execute.mockResolvedValue(undefined);
    includeActiveContext = true;
    const spectator: Spectator<RecordObservationPage> = createComponent();
    spectator.typeInElement('El coral está abierto', 'textarea');

    await spectator.click('button');
    spectator.detectChanges();

    expect(execute).toHaveBeenCalledWith('El coral está abierto');
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'guardada correctamente',
    );
  });

  it('shows a recoverable error when saving fails', async () => {
    execute.mockRejectedValue(new Error('offline'));
    includeActiveContext = true;
    const spectator: Spectator<RecordObservationPage> = createComponent();
    spectator.typeInElement('La bomba hace ruido', 'textarea');

    await spectator.click('button');
    spectator.detectChanges();

    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se ha podido guardar',
    );
  });

  it('does not show the form without an active Aquarium', () => {
    const spectator: Spectator<RecordObservationPage> = createComponent();

    expect(spectator.query('form')).toBeNull();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
    expect(spectator.query('a')?.getAttribute('href')).toBe('/app/aquariums');
    expect(execute).not.toHaveBeenCalled();
  });
});
