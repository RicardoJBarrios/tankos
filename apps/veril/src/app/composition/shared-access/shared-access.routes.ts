import { Routes } from '@angular/router';
import { authenticatedAccessGuard } from '../../shared/ui/guards/authenticated-access.guard';
import { SHARED_ACCESS_PROVIDERS } from './shared-access.providers';

export const SHARED_ACCESS_ROUTES: Routes = [
  {
    path: 'aquariums/:aquariumId/measurements/history',
    canActivate: [authenticatedAccessGuard],
    providers: SHARED_ACCESS_PROVIDERS,
    loadComponent: () =>
      import('../../shared-access/ui/shared-parameter-history-page').then(
        ({ SharedParameterHistoryPage }) => SharedParameterHistoryPage,
      ),
  },
  {
    path: 'aquariums/:aquariumId',
    canActivate: [authenticatedAccessGuard],
    providers: SHARED_ACCESS_PROVIDERS,
    loadComponent: () =>
      import('../../shared-access/ui/shared-aquarium-page').then(
        ({ SharedAquariumPage }) => SharedAquariumPage,
      ),
  },
];
