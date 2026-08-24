import { createAngularTimeLocaleAdapter } from './angular-time-locale-adapter';

describe('angular-time-locale-adapter', () => {
  it('Given a locale supplied by the composition layer, When reading it, Then it returns that locale', () => {
    const adapter = createAngularTimeLocaleAdapter('es-ES');

    expect(adapter.getLocale()).toBe('es-ES');
  });
});
