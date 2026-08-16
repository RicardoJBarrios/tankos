import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../../shared/application/active-aquarium-context-storage';
import { RecordCareWork } from '../../application/record-care-work';
import { aquariumIdFrom } from '../../../shared/domain/aquarium-reference';
import { RecordCareWorkPage } from './record-care-work-page';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

describe('RecordCareWorkPage', () => {
  const execute = vi.fn();
  let includeActiveContext = false;
  const createComponent = createComponentFactory({
    component: RecordCareWorkPage,
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
        RecordCareWorkPage,
        {
          set: {
            providers: [{ provide: RecordCareWork, useValue: { execute } }],
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
    const spectator: Spectator<RecordCareWorkPage> = createComponent();
    expect(spectator.query('form')).toBeNull();
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'Primero selecciona un acuario',
    );
    expect(spectator.query('a')?.getAttribute('href')).toBe('/app/aquariums');
  });

  it('submits the description and performed time', async () => {
    includeActiveContext = true;
    execute.mockResolvedValue(undefined);
    const spectator: Spectator<RecordCareWorkPage> = createComponent();
    spectator.typeInElement('Limpié la copa', '#care-work-description');
    await spectator.click('button');
    spectator.detectChanges();
    expect(execute).toHaveBeenCalledWith('Limpié la copa', expect.any(Date));
    expect(spectator.query('[role="status"]')?.textContent).toContain(
      'guardado correctamente',
    );
  });

  it('validates empty description and shows recoverable failures', async () => {
    includeActiveContext = true;
    const spectator: Spectator<RecordCareWorkPage> = createComponent();
    await spectator.click('button');
    spectator.detectChanges();
    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'Describe el cuidado',
    );

    execute.mockRejectedValue(new Error('offline'));
    spectator.typeInElement('Limpieza', '#care-work-description');
    await spectator.click('button');
    spectator.detectChanges();
    expect(spectator.query('[role="alert"]')?.textContent).toContain(
      'No se ha podido guardar',
    );
  });

  it('exposes the pending state while saving', async () => {
    includeActiveContext = true;
    let resolveSave!: () => void;
    execute.mockImplementation(
      () => new Promise<void>((resolve) => (resolveSave = resolve)),
    );
    const spectator: Spectator<RecordCareWorkPage> = createComponent();
    spectator.typeInElement('Limpieza', '#care-work-description');
    const submit = spectator.click('button');
    spectator.detectChanges();
    expect(spectator.query('button')?.hasAttribute('disabled')).toBe(true);
    expect(spectator.query('button')?.textContent).toContain('Guardando');
    resolveSave();
    await submit;
  });
});
