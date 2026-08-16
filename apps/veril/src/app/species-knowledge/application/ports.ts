import {
  SpeciesProfile,
  SpeciesProfileId,
  SpeciesProfileDraft,
  SpeciesProfileReference,
} from '../domain/species-profile';

export type {
  SpeciesProfile,
  SpeciesProfileDraft,
} from '../domain/species-profile';

export interface PublishedSpeciesProfileReader {
  listPublished(): Promise<readonly SpeciesProfileReference[]>;
  getPublished(id: SpeciesProfileId): Promise<SpeciesProfile | null>;
}

export interface SpeciesProfileDraftWriter {
  saveDraft(draft: SpeciesProfileDraft): Promise<void>;
}

export interface SpeciesProfileDraftReader {
  getDraft(id: SpeciesProfileId): Promise<SpeciesProfileDraft | null>;
}

export interface SpeciesProfilePublisher {
  publishDraft(
    draft: SpeciesProfileDraft,
    revisionId: string,
    publishedAt: Date,
  ): Promise<void>;
}
