import { Route } from '@angular/router';
import { EDITORIAL_PROVIDERS } from './editorial.providers';

export const EDITORIAL_SPECIES_KNOWLEDGE_ROUTES: Route[] = [
  {
    path: ':id',
    providers: EDITORIAL_PROVIDERS,
    loadComponent: () =>
      import('../../species-knowledge/ui/pages/edit-species-profile-page').then(
        ({ EditSpeciesProfilePage }) => EditSpeciesProfilePage,
      ),
  },
  {
    path: ':id/history',
    providers: EDITORIAL_PROVIDERS,
    loadComponent: () =>
      import('../../species-knowledge/ui/pages/species-profile-history-page').then(
        ({ SpeciesProfileHistoryPage }) => SpeciesProfileHistoryPage,
      ),
  },
];
