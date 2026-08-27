import type { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('@tankos/authn-firebase-ui').then(
        ({ FirebaseLoginPageComponent }) => FirebaseLoginPageComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        ({ DashboardComponent }) => DashboardComponent,
      ),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./forbidden/forbidden-page.component').then(
        ({ ForbiddenPageComponent }) => ForbiddenPageComponent,
      ),
  },
  {
    path: 'units',
    loadChildren: () =>
      Promise.all([
        import('@tankos/units-ui'),
        import('./units.providers'),
      ]).then(([ui, composition]) => [
        {
          path: '',
          providers: [composition.provideTankosUnits()],
          children: ui.unitsRoutes,
        },
      ]),
  },
];
