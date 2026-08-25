import {
  SpeciesProfile,
  SpeciesProfileId,
  SpeciesProfileDraft,
  SpeciesProfileDraftStatus,
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

export interface SpeciesProfileRevisionReader {
  listRevisions(id: SpeciesProfileId): Promise<readonly SpeciesProfile[]>;
}

export interface SpeciesProfileDraftWriter {
  saveDraft(draft: Omit<SpeciesProfileDraft, 'status'>): Promise<void>;
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

export interface SpeciesProfileReviewer {
  reviewDraft(id: SpeciesProfileId): Promise<void>;
}

export interface SpeciesProfileRetirer {
  retireProfile(id: SpeciesProfileId): Promise<void>;
}

export type { SpeciesProfileDraftStatus };
