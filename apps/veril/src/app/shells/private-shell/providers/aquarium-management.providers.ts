import { inject, Provider } from '@angular/core';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ReadAquariumDashboardContext } from '../../../aquarium-management/application/read-aquarium-dashboard-context';
import { RemoveParameterTarget } from '../../../aquarium-management/application/remove-parameter-target';
import { RestoreActiveAquarium } from '../../../aquarium-management/application/restore-active-aquarium';
import { SaveParameterTarget } from '../../../aquarium-management/application/save-parameter-target';
import { FirestoreAquariumRepository } from '../../../aquarium-management/infrastructure/firestore-aquarium-repository';
import { InMemoryLocalWeatherReader } from '../../../aquarium-management/infrastructure/in-memory-local-weather-reader';
import { OpenMeteoLocalWeatherReader } from '../../../aquarium-management/infrastructure/open-meteo-local-weather-reader';
import { OpenMeteoLocationSearch } from '../../../aquarium-management/infrastructure/open-meteo-location-search';
import {
  AQUARIUM_DASHBOARD_READER,
  AQUARIUM_LOCATION_CONFIGURER,
  AQUARIUM_REPOSITORY,
  AQUARIUM_TIME_ZONE_CONFIGURER,
  LOCAL_WEATHER_READER,
  LOCATION_SEARCH,
  PARAMETER_TARGET_WRITER,
} from '../../../aquarium-management/ui/providers';
import {
  ACTIVE_AQUARIUM_CONTEXT_STORAGE,
  KEEPER_SESSION,
} from '../../../shared/ui/providers';

export const PRIVATE_AQUARIUM_MANAGEMENT_PROVIDERS: Provider[] = [
  { provide: AQUARIUM_REPOSITORY, useClass: FirestoreAquariumRepository },
  { provide: AQUARIUM_DASHBOARD_READER, useClass: FirestoreAquariumRepository },
  {
    provide: AQUARIUM_TIME_ZONE_CONFIGURER,
    useClass: FirestoreAquariumRepository,
  },
  {
    provide: AQUARIUM_LOCATION_CONFIGURER,
    useClass: FirestoreAquariumRepository,
  },
  { provide: PARAMETER_TARGET_WRITER, useClass: FirestoreAquariumRepository },
  { provide: LOCATION_SEARCH, useClass: OpenMeteoLocationSearch },
  {
    provide: LOCAL_WEATHER_READER,
    useFactory: () =>
      new InMemoryLocalWeatherReader(new OpenMeteoLocalWeatherReader()),
  },
  {
    provide: ReadAquariumDashboardContext,
    useFactory: () =>
      new ReadAquariumDashboardContext(
        inject(AQUARIUM_DASHBOARD_READER),
        inject(KEEPER_SESSION),
        inject(ActiveAquariumContext),
      ),
  },
  {
    provide: SaveParameterTarget,
    useFactory: () =>
      new SaveParameterTarget(
        inject(PARAMETER_TARGET_WRITER),
        inject(KEEPER_SESSION),
        inject(ActiveAquariumContext),
      ),
  },
  {
    provide: RemoveParameterTarget,
    useFactory: () =>
      new RemoveParameterTarget(
        inject(PARAMETER_TARGET_WRITER),
        inject(KEEPER_SESSION),
        inject(ActiveAquariumContext),
      ),
  },
  {
    provide: RestoreActiveAquarium,
    useFactory: () =>
      new RestoreActiveAquarium(
        inject(AQUARIUM_REPOSITORY),
        inject(KEEPER_SESSION),
        inject(ActiveAquariumContext),
        inject(ACTIVE_AQUARIUM_CONTEXT_STORAGE),
      ),
  },
];
