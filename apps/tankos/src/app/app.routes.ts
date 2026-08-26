import { Route } from '@angular/router';
import { authGuard } from '@tankos/authn';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login-page.component').then(
        ({ LoginPageComponent }) => LoginPageComponent,
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
    path: 'units',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./units/units-page.component').then(
        ({ UnitsPageComponent }) => UnitsPageComponent,
      ),
  },
];
