import { Spectator, createComponentFactory } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { PrivateShell } from './private-shell';

describe('PrivateShell', () => {
  const createComponent = createComponentFactory({
    component: PrivateShell,
    providers: [provideRouter([])],
  });

  it('renders the private shell without domain features', async () => {
    const spectator: Spectator<PrivateShell> = createComponent();
    await spectator.fixture.whenStable();

    expect(spectator.query('h1')?.textContent).toBe('Área privada');
    expect(spectator.query('router-outlet')).toBeTruthy();
  });
});
