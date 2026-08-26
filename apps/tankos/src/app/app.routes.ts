import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        ({ DashboardComponent }) => DashboardComponent,
      ),
  },
  {
    path: 'units',
    loadComponent: () =>
      import('./units/units-page.component').then(
        ({ UnitsPageComponent }) => UnitsPageComponent,
      ),
  },
];
