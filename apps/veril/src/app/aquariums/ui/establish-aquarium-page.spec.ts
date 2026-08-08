import { createComponentFactory, Spectator } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { EstablishAquarium } from '../application/establish-aquarium';
import { EstablishAquariumPage } from './establish-aquarium-page';
import { AquariumName, aquariumIdFrom } from '../domain/aquarium';

describe('EstablishAquariumPage', () => {
  const establish = vi.fn().mockResolvedValue({
    id: aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000'),
    name: AquariumName.create('Veril'),
    ownerKeeperId: 'keeper-a',
    establishedAt: new Date(),
  });
  const createComponent = createComponentFactory({
    component: EstablishAquariumPage,
    providers: [provideRouter([])],
    componentProviders: [
      { provide: EstablishAquarium, useValue: { execute: establish } },
    ],
  });

  it('renders the Spanish establishment form', () => {
    const spectator: Spectator<EstablishAquariumPage> = createComponent();

    expect(spectator.query('h1')?.textContent).toContain('Establecer acuario');
    expect(spectator.query('label')?.textContent).toContain(
      'Nombre del acuario',
    );
  });

  it('submits the Aquarium name and renders success', async () => {
    const spectator: Spectator<EstablishAquariumPage> = createComponent();
    spectator.typeInElement('Veril', '#aquarium-name');
    spectator.click('button');
    await spectator.fixture.whenStable();

    expect(establish).toHaveBeenCalledWith('Veril');
    expect(spectator.query('[role="status"]')?.textContent).toContain('Veril');
    expect(spectator.query('a')?.getAttribute('href')).toBe('/app/aquariums');
  });
});
