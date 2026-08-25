import { Route } from '@angular/router';
import { authenticatedAccessGuard } from './shared/ui/guards/authenticated-access.guard';
import { editorialAccessGuard } from './shared/ui/guards/editorial-access.guard';
import { keeperAccessGuard } from './shared/ui/guards/keeper-access.guard';
import { PRIVATE_ROUTE_PRESENTATION } from './shells/private-shell/private-route-presentation';

export const appRoutes: Route[] = [
  {
    path: 'access/accept',
    canActivate: [authenticatedAccessGuard],
    loadComponent: () =>
      import('./shared-access/ui/accept-aquarium-invitation-page').then(
        ({ AcceptAquariumInvitationPage }) => AcceptAquariumInvitationPage,
      ),
  },
  {
    path: 'shared',
    loadChildren: () =>
      import('./composition/shared-access/shared-access.routes').then(
        ({ SHARED_ACCESS_ROUTES }) => SHARED_ACCESS_ROUTES,
      ),
  },
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./species-knowledge/ui/pages/editorial-sign-in-page').then(
        ({ EditorialSignInPage }) => EditorialSignInPage,
      ),
  },
  {
    path: 'editorial/species-knowledge',
    canActivate: [editorialAccessGuard],
    loadChildren: () =>
      import('./composition/editorial/editorial.routes').then(
        ({ EDITORIAL_SPECIES_KNOWLEDGE_ROUTES }) =>
          EDITORIAL_SPECIES_KNOWLEDGE_ROUTES,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shells/public-shell/public-shell').then(
        ({ PublicShell }) => PublicShell,
      ),
    children: [
      {
        path: 'species-knowledge/:id',
        loadComponent: () =>
          import('./species-knowledge/ui/pages/species-profile-page').then(
            ({ SpeciesProfilePage }) => SpeciesProfilePage,
          ),
      },
    ],
  },
  {
    path: 'app',
    canActivate: [keeperAccessGuard],
    loadComponent: () =>
      import('./shells/private-shell/private-shell').then(
        ({ PrivateShell }) => PrivateShell,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'aquariums/current',
      },
      {
        path: 'aquariums',
        pathMatch: 'full',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.aquariumList },
        loadComponent: () =>
          import('./aquarium-management/ui/pages/list-my-aquariums-page').then(
            ({ ListMyAquariumsPage }) => ListMyAquariumsPage,
          ),
      },
      {
        path: 'aquariums/new',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.establishAquarium },
        loadComponent: () =>
          import('./aquarium-management/ui/pages/establish-aquarium-page').then(
            ({ EstablishAquariumPage }) => EstablishAquariumPage,
          ),
      },
      {
        path: 'aquariums/current',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.today },
        loadComponent: () =>
          import('./composition/aquarium-dashboard/aquarium-dashboard-page').then(
            ({ AquariumDashboardPage }) => AquariumDashboardPage,
          ),
      },
      {
        path: 'aquariums/manage',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.manageAquarium },
        loadComponent: () =>
          import('./composition/aquarium-management/aquarium-management-page').then(
            ({ AquariumManagementPage }) => AquariumManagementPage,
          ),
      },
      {
        path: 'aquariums/access',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.aquariumAccess },
        loadComponent: () =>
          import('./shared-access/ui/pages/manage-aquarium-access-page').then(
            ({ ManageAquariumAccessPage }) => ManageAquariumAccessPage,
          ),
      },
      {
        path: 'aquariums/timezone',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.timezone },
        loadComponent: () =>
          import('./aquarium-management/ui/pages/configure-aquarium-time-zone-page').then(
            ({ ConfigureAquariumTimeZonePage }) =>
              ConfigureAquariumTimeZonePage,
          ),
      },
      {
        path: 'aquariums/location',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.location },
        loadComponent: () =>
          import('./aquarium-management/ui/pages/configure-aquarium-location-page').then(
            ({ ConfigureAquariumLocationPage }) =>
              ConfigureAquariumLocationPage,
          ),
      },
      {
        path: 'aquariums/parameter-targets',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.parameterTargets },
        loadComponent: () =>
          import('./aquarium-management/ui/pages/configure-parameter-targets-page').then(
            ({ ConfigureParameterTargetsPage }) =>
              ConfigureParameterTargetsPage,
          ),
      },
      {
        path: 'aquariums/equipment',
        pathMatch: 'full',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.equipmentList },
        loadComponent: () =>
          import('./equipment/ui/pages/list-equipment-page').then(
            ({ ListEquipmentPage }) => ListEquipmentPage,
          ),
      },
      {
        path: 'aquariums/equipment/new',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.equipmentForm },
        loadComponent: () =>
          import('./equipment/ui/pages/equipment-form-page').then(
            ({ EquipmentFormPage }) => EquipmentFormPage,
          ),
      },
      {
        path: 'aquariums/equipment/transfer',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.equipmentTransfer },
        loadComponent: () =>
          import('./equipment/ui/pages/transfer-equipment-page').then(
            ({ TransferEquipmentPage }) => TransferEquipmentPage,
          ),
      },
      {
        path: 'aquariums/equipment/:id',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.equipmentDetail },
        loadComponent: () =>
          import('./equipment/ui/pages/equipment-form-page').then(
            ({ EquipmentFormPage }) => EquipmentFormPage,
          ),
      },
      {
        path: 'aquariums/livestock',
        pathMatch: 'full',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.livestockList },
        loadComponent: () =>
          import('./livestock/ui/pages/list-livestock-page').then(
            ({ ListLivestockPage }) => ListLivestockPage,
          ),
      },
      {
        path: 'aquariums/livestock/new',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.livestockForm },
        loadComponent: () =>
          import('./livestock/ui/pages/add-livestock-page').then(
            ({ AddLivestockPage }) => AddLivestockPage,
          ),
      },
      {
        path: 'aquariums/livestock/transfer',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.livestockTransfer },
        loadComponent: () =>
          import('./livestock/ui/pages/transfer-livestock-page').then(
            ({ TransferLivestockPage }) => TransferLivestockPage,
          ),
      },
      {
        path: 'aquariums/livestock/history',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.livestockHistory },
        loadComponent: () =>
          import('./livestock/ui/pages/livestock-history-page').then(
            ({ LivestockHistoryPage }) => LivestockHistoryPage,
          ),
      },
      {
        path: 'aquariums/livestock/:id',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.livestockDetail },
        loadComponent: () =>
          import('./livestock/ui/pages/livestock-detail-page').then(
            ({ LivestockDetailPage }) => LivestockDetailPage,
          ),
      },
      {
        path: 'aquariums/observations/new',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.observationsForm },
        loadComponent: () =>
          import('./observations/ui/pages/record-observation-page').then(
            ({ RecordObservationPage }) => RecordObservationPage,
          ),
      },
      {
        path: 'aquariums/observations',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.observationsList },
        loadComponent: () =>
          import('./observations/ui/pages/list-observations-page').then(
            ({ ListObservationsPage }) => ListObservationsPage,
          ),
      },
      {
        path: 'aquariums/measurements',
        pathMatch: 'full',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.measurementsList },
        loadComponent: () =>
          import('./measurements/ui/pages/list-measurements-page').then(
            ({ ListMeasurementsPage }) => ListMeasurementsPage,
          ),
      },
      {
        path: 'aquariums/measurements/history',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.parameterHistory },
        loadComponent: () =>
          import('./measurements/ui/pages/parameter-history-page').then(
            ({ ParameterHistoryPage }) => ParameterHistoryPage,
          ),
      },
      {
        path: 'aquariums/timeline',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.timeline },
        loadComponent: () =>
          import('./timeline/ui/pages/review-recent-timeline-page').then(
            ({ ReviewRecentTimelinePage }) => ReviewRecentTimelinePage,
          ),
      },
      {
        path: 'aquariums/measurements/:id/correct',
        data: {
          presentation: PRIVATE_ROUTE_PRESENTATION.measurementCorrection,
        },
        loadComponent: () =>
          import('./measurements/ui/pages/record-measurement-page').then(
            ({ RecordMeasurementPage }) => RecordMeasurementPage,
          ),
      },
      {
        path: 'aquariums/measurements/new',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.measurementForm },
        loadComponent: () =>
          import('./measurements/ui/pages/record-measurement-page').then(
            ({ RecordMeasurementPage }) => RecordMeasurementPage,
          ),
      },
      {
        path: 'aquariums/care/new',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.careForm },
        loadComponent: () =>
          import('./care/ui/pages/record-care-work-page').then(
            ({ RecordCareWorkPage }) => RecordCareWorkPage,
          ),
      },
      {
        path: 'aquariums/maintenance/new',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.waterChangeForm },
        loadComponent: () =>
          import('./maintenance/ui/pages/record-water-change-page').then(
            ({ RecordWaterChangePage }) => RecordWaterChangePage,
          ),
      },
      {
        path: 'aquariums/maintenance',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.waterChangesList },
        loadComponent: () =>
          import('./maintenance/ui/pages/list-water-changes-page').then(
            ({ ListWaterChangesPage }) => ListWaterChangesPage,
          ),
      },
      {
        path: 'aquariums/care/planned/new',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.plannedCareForm },
        loadComponent: () =>
          import('./care/ui/pages/plan-care-work-page').then(
            ({ PlanCareWorkPage }) => PlanCareWorkPage,
          ),
      },
      {
        path: 'aquariums/care/recurring/new',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.recurringCareForm },
        loadComponent: () =>
          import('./care/ui/pages/establish-weekly-recurring-care-page').then(
            ({ EstablishWeeklyRecurringCarePage }) =>
              EstablishWeeklyRecurringCarePage,
          ),
      },
      {
        path: 'aquariums/care/planned',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.agenda },
        loadComponent: () =>
          import('./care/ui/pages/list-planned-care-work-page').then(
            ({ ListPlannedCareWorkPage }) => ListPlannedCareWorkPage,
          ),
      },
      {
        path: 'aquariums/care',
        data: { presentation: PRIVATE_ROUTE_PRESENTATION.careList },
        loadComponent: () =>
          import('./care/ui/pages/list-care-work-page').then(
            ({ ListCareWorkPage }) => ListCareWorkPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
