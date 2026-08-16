import { InjectionToken } from '@angular/core';
import {
  PublishedSpeciesProfileReader,
  SpeciesProfileDraftWriter,
} from '../application/ports';

export const PUBLISHED_SPECIES_PROFILE_READER =
  new InjectionToken<PublishedSpeciesProfileReader>(
    'PUBLISHED_SPECIES_PROFILE_READER',
  );

export const SPECIES_PROFILE_DRAFT_WRITER =
  new InjectionToken<SpeciesProfileDraftWriter>('SPECIES_PROFILE_DRAFT_WRITER');
