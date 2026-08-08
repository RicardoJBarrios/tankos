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
    children: [
      {
        path: 'aquariums',
        pathMatch: 'full',
        loadComponent: () =>
          import('./aquariums/ui/list-my-aquariums-page').then(
            ({ ListMyAquariumsPage }) => ListMyAquariumsPage,
          ),
      },
      {
        path: 'aquariums/new',
        loadComponent: () =>
          import('./aquariums/ui/establish-aquarium-page').then(
            ({ EstablishAquariumPage }) => EstablishAquariumPage,
          ),
      },
      {
        path: 'aquariums/current',
        loadComponent: () =>
          import('./aquariums/ui/aquarium-workspace-page').then(
            ({ AquariumWorkspacePage }) => AquariumWorkspacePage,
          ),
      },
      {
        path: 'aquariums/observations/new',
        loadComponent: () =>
          import('./aquariums/ui/record-observation-page').then(
            ({ RecordObservationPage }) => RecordObservationPage,
          ),
      },
      {
        path: 'aquariums/observations',
        loadComponent: () =>
          import('./aquariums/ui/list-observations-page').then(
            ({ ListObservationsPage }) => ListObservationsPage,
          ),
      },
      {
        path: 'aquariums/measurements',
        loadComponent: () =>
          import('./aquariums/ui/list-measurements-page').then(
            ({ ListMeasurementsPage }) => ListMeasurementsPage,
          ),
      },
      {
        path: 'aquariums/timeline',
        loadComponent: () =>
          import('./aquariums/ui/review-recent-timeline-page').then(
            ({ ReviewRecentTimelinePage }) => ReviewRecentTimelinePage,
          ),
      },
      {
        path: 'aquariums/measurements/new',
        loadComponent: () =>
          import('./aquariums/ui/record-measurement-page').then(
            ({ RecordMeasurementPage }) => RecordMeasurementPage,
          ),
      },
      {
        path: 'aquariums/care/new',
        loadComponent: () =>
          import('./aquariums/ui/record-care-work-page').then(
            ({ RecordCareWorkPage }) => RecordCareWorkPage,
          ),
      },
      {
        path: 'aquariums/care',
        loadComponent: () =>
          import('./aquariums/ui/list-care-work-page').then(
            ({ ListCareWorkPage }) => ListCareWorkPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
