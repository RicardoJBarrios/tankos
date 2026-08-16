import { InjectionToken } from '@angular/core';
import {
  PublishedSpeciesProfileReader,
  SpeciesProfileDraftReader,
  SpeciesProfileDraftWriter,
  SpeciesProfilePublisher,
  SpeciesProfileReviewer,
  SpeciesProfileRevisionReader,
} from '../application/ports';

export const PUBLISHED_SPECIES_PROFILE_READER =
  new InjectionToken<PublishedSpeciesProfileReader>(
    'PUBLISHED_SPECIES_PROFILE_READER',
  );

export const SPECIES_PROFILE_DRAFT_WRITER =
  new InjectionToken<SpeciesProfileDraftWriter>('SPECIES_PROFILE_DRAFT_WRITER');

export const SPECIES_PROFILE_DRAFT_READER =
  new InjectionToken<SpeciesProfileDraftReader>('SPECIES_PROFILE_DRAFT_READER');

export const SPECIES_PROFILE_PUBLISHER =
  new InjectionToken<SpeciesProfilePublisher>('SPECIES_PROFILE_PUBLISHER');

export const SPECIES_PROFILE_REVIEWER =
  new InjectionToken<SpeciesProfileReviewer>('SPECIES_PROFILE_REVIEWER');

export const SPECIES_PROFILE_REVISION_READER =
  new InjectionToken<SpeciesProfileRevisionReader>(
    'SPECIES_PROFILE_REVISION_READER',
  );
