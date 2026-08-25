import { Spectator, createComponentFactory } from '@ngneat/spectator/vitest';
import { App } from './app';

describe('App', () => {
  const createComponent = createComponentFactory(App);

  it('should provide the root router outlet', async () => {
    const spectator: Spectator<App> = createComponent();
    await spectator.fixture.whenStable();

    expect(spectator.query('router-outlet')).toBeTruthy();
  });
});
