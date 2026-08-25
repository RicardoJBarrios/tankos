import { Spectator, createComponentFactory } from '@ngneat/spectator/vitest';
import { provideRouter } from '@angular/router';
import { PublicShell } from './public-shell';

describe('PublicShell', () => {
  const createComponent = createComponentFactory({
    component: PublicShell,
    providers: [provideRouter([])],
  });

  it('renders public navigation and content', async () => {
    const spectator: Spectator<PublicShell> = createComponent();
    await spectator.fixture.whenStable();

    expect(spectator.query('h1')?.textContent).toBe('Veril');
    expect(
      Array.from(spectator.queryAll('a')).some((link) =>
        link.textContent?.includes('Área privada'),
      ),
    ).toBe(true);
  });
});
