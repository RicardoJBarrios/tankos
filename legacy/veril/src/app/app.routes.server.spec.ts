import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
  it('keeps the private application client-rendered', () => {
    expect(serverRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'app',
          renderMode: RenderMode.Client,
        }),
        expect.objectContaining({
          path: 'app/**',
          renderMode: RenderMode.Client,
        }),
      ]),
    );
  });

  it('keeps editorial editing client-rendered', () => {
    expect(serverRoutes).toContainEqual({
      path: 'editorial/species-knowledge/**',
      renderMode: RenderMode.Client,
    });
  });

  it('keeps public species profiles client-rendered', () => {
    expect(serverRoutes).toContainEqual({
      path: 'species-knowledge/**',
      renderMode: RenderMode.Client,
    });
  });

  it('keeps authenticated shared access client-rendered', () => {
    expect(serverRoutes).toContainEqual({
      path: 'access/**',
      renderMode: RenderMode.Client,
    });
    expect(serverRoutes).toContainEqual({
      path: 'shared/aquariums/**',
      renderMode: RenderMode.Client,
    });
  });

  it('prerenders public routes by default', () => {
    expect(serverRoutes).toContainEqual({
      path: '**',
      renderMode: RenderMode.Prerender,
    });
  });
});
