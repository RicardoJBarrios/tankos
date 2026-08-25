import { InjectionToken } from '@angular/core';
import {
  AquariumDashboardReader,
  AquariumLocationConfigurer,
  AquariumReader,
  AquariumRepository,
  AquariumTimeZoneConfigurer,
  LocalWeatherReader,
  LocationSearch,
  ParameterTargetWriter,
} from '../application/ports';
export { KEEPER_SESSION } from '../../shared/ui/providers';

export const AQUARIUM_REPOSITORY = new InjectionToken<
  AquariumRepository & AquariumReader
>('AQUARIUM_REPOSITORY');
export const AQUARIUM_DASHBOARD_READER =
  new InjectionToken<AquariumDashboardReader>('AQUARIUM_DASHBOARD_READER');
export const PARAMETER_TARGET_WRITER =
  new InjectionToken<ParameterTargetWriter>('PARAMETER_TARGET_WRITER');
export const AQUARIUM_TIME_ZONE_CONFIGURER =
  new InjectionToken<AquariumTimeZoneConfigurer>(
    'AQUARIUM_TIME_ZONE_CONFIGURER',
  );
export const AQUARIUM_LOCATION_CONFIGURER =
  new InjectionToken<AquariumLocationConfigurer>(
    'AQUARIUM_LOCATION_CONFIGURER',
  );
export const LOCATION_SEARCH = new InjectionToken<LocationSearch>(
  'LOCATION_SEARCH',
);
export const LOCAL_WEATHER_READER = new InjectionToken<LocalWeatherReader>(
  'LOCAL_WEATHER_READER',
);
