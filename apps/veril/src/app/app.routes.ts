import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./shells/public-shell/public-shell').then(
        ({ PublicShell }) => PublicShell,
      ),
  },
  {
    path: 'app',
    loadComponent: () =>
      import('./shells/private-shell/private-shell').then(
        ({ PrivateShell }) => PrivateShell,
      ),
  },
  { path: '**', redirectTo: '' },
];
