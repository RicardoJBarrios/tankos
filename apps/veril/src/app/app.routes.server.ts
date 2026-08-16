import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'editorial/species-knowledge/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'app',
    renderMode: RenderMode.Client,
  },
  {
    path: 'app/**',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
