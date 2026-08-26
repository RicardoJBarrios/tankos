import { Route } from '@angular/router';
import { authGuard } from '@tankos/auth';

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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./units/units-page.component').then(
        ({ UnitsPageComponent }) => UnitsPageComponent,
      ),
  },
];
