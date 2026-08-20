export type PrivateRouteKind =
  'top-level' | 'secondary' | 'form' | 'detail' | 'external/shared';

export type PrivatePrimaryDestinationId =
  'today' | 'agenda' | 'history' | 'aquarium';

export interface PrivateRoutePresentation {
  readonly kind: PrivateRouteKind;
  readonly title: string;
  readonly primaryDestination?: PrivatePrimaryDestinationId;
  readonly showRecordEntry?: boolean;
}

export const PRIVATE_PRIMARY_DESTINATIONS = [
  {
    id: 'today',
    label: 'Hoy',
    route: '/app/aquariums/current',
  },
  {
    id: 'agenda',
    label: 'Agenda',
    route: '/app/aquariums/care/planned',
  },
  {
    id: 'history',
    label: 'Historial',
    route: '/app/aquariums/timeline',
  },
  {
    id: 'aquarium',
    label: 'Acuario',
    route: '/app/aquariums/manage',
  },
] as const satisfies ReadonlyArray<{
  readonly id: PrivatePrimaryDestinationId;
  readonly label: string;
  readonly route: string;
}>;

export const PRIVATE_ROUTE_PRESENTATION = {
  aquariumList: {
    kind: 'secondary',
    title: 'Mis acuarios',
  },
  establishAquarium: {
    kind: 'form',
    title: 'Crear acuario',
  },
  today: {
    kind: 'top-level',
    title: 'Hoy',
    primaryDestination: 'today',
    showRecordEntry: true,
  },
  manageAquarium: {
    kind: 'top-level',
    title: 'Acuario',
    primaryDestination: 'aquarium',
    showRecordEntry: true,
  },
  aquariumAccess: {
    kind: 'secondary',
    title: 'Compartir acceso',
  },
  timezone: {
    kind: 'secondary',
    title: 'Zona horaria',
  },
  location: {
    kind: 'secondary',
    title: 'Ubicación',
  },
  parameterTargets: {
    kind: 'secondary',
    title: 'Parámetros y objetivos',
  },
  equipmentList: {
    kind: 'secondary',
    title: 'Equipos',
    primaryDestination: 'aquarium',
  },
  equipmentForm: {
    kind: 'form',
    title: 'Equipo',
  },
  equipmentTransfer: {
    kind: 'form',
    title: 'Transferir equipo',
  },
  equipmentDetail: {
    kind: 'detail',
    title: 'Equipo',
  },
  livestockList: {
    kind: 'secondary',
    title: 'Habitantes',
    primaryDestination: 'aquarium',
  },
  livestockForm: {
    kind: 'form',
    title: 'Añadir habitante',
  },
  livestockTransfer: {
    kind: 'form',
    title: 'Transferir habitante',
  },
  livestockHistory: {
    kind: 'detail',
    title: 'Historial de habitantes',
  },
  livestockDetail: {
    kind: 'detail',
    title: 'Habitante',
  },
  observationsForm: {
    kind: 'form',
    title: 'Registrar observación',
  },
  observationsList: {
    kind: 'secondary',
    title: 'Observaciones',
    primaryDestination: 'history',
  },
  measurementsList: {
    kind: 'secondary',
    title: 'Mediciones',
    primaryDestination: 'history',
  },
  parameterHistory: {
    kind: 'detail',
    title: 'Historial de mediciones',
    primaryDestination: 'history',
  },
  measurementCorrection: {
    kind: 'form',
    title: 'Corregir medición',
  },
  measurementForm: {
    kind: 'form',
    title: 'Registrar medición',
  },
  timeline: {
    kind: 'top-level',
    title: 'Historial',
    primaryDestination: 'history',
    showRecordEntry: true,
  },
  careForm: {
    kind: 'form',
    title: 'Registrar cuidado',
  },
  waterChangeForm: {
    kind: 'form',
    title: 'Registrar cambio de agua',
  },
  waterChangesList: {
    kind: 'secondary',
    title: 'Cambios de agua',
    primaryDestination: 'history',
  },
  plannedCareForm: {
    kind: 'form',
    title: 'Planificar cuidado',
  },
  recurringCareForm: {
    kind: 'form',
    title: 'Planificar cuidado semanal',
  },
  agenda: {
    kind: 'top-level',
    title: 'Agenda',
    primaryDestination: 'agenda',
    showRecordEntry: true,
  },
  careList: {
    kind: 'secondary',
    title: 'Cuidados recientes',
    primaryDestination: 'history',
  },
} as const satisfies Record<string, PrivateRoutePresentation>;

export type PrivateRoutePresentationKey =
  keyof typeof PRIVATE_ROUTE_PRESENTATION;
