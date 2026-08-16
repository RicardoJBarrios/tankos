import { InjectionToken } from '@angular/core';
import { PublishedSpeciesProfileReader } from '../application/ports';

export const PUBLISHED_SPECIES_PROFILE_READER =
  new InjectionToken<PublishedSpeciesProfileReader>(
    'PUBLISHED_SPECIES_PROFILE_READER',
  );
