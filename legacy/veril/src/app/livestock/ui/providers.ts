import { InjectionToken } from '@angular/core';
import {
  AquariumCatalog,
  LivestockReader,
  LivestockWriter,
  SpeciesProfileCatalog,
} from '../application/ports';

export { KEEPER_SESSION } from '../../shared/ui/providers';

export const LIVESTOCK_READER = new InjectionToken<LivestockReader>(
  'LIVESTOCK_READER',
);
export const LIVESTOCK_WRITER = new InjectionToken<LivestockWriter>(
  'LIVESTOCK_WRITER',
);
export const LIVESTOCK_AQUARIUM_CATALOG = new InjectionToken<AquariumCatalog>(
  'LIVESTOCK_AQUARIUM_CATALOG',
);
export const LIVESTOCK_SPECIES_PROFILE_CATALOG =
  new InjectionToken<SpeciesProfileCatalog>(
    'LIVESTOCK_SPECIES_PROFILE_CATALOG',
  );
