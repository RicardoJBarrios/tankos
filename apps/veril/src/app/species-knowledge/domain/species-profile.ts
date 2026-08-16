import { isUuidV4 } from '../../shared/domain/uuid-v4';

export type SpeciesProfileId = string & {
  readonly __speciesProfileId: unique symbol;
};

export function speciesProfileIdFrom(value: string): SpeciesProfileId {
  if (!isUuidV4(value)) throw new Error('Species Profile ID must be a UUID v4');
  return value as SpeciesProfileId;
}

export type SpeciesProfileStatus = 'published' | 'retired';

export interface SpeciesProfileSection {
  readonly key: string;
  readonly title: string;
  readonly content: string;
}

export interface SpeciesProfileSource {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly publishedAt?: Date;
}

export interface SpeciesProfileRevision {
  readonly id: string;
  readonly publishedAt: Date;
}

export interface SpeciesProfile extends SpeciesProfileReference {
  readonly description: string;
  readonly sections: readonly SpeciesProfileSection[];
  readonly sources: readonly SpeciesProfileSource[];
  readonly revision: SpeciesProfileRevision;
}

export interface SpeciesProfileDraft {
  readonly speciesProfileId: SpeciesProfileId;
  readonly displayName: string;
  readonly scientificName?: string;
  readonly description: string;
  readonly sections: readonly SpeciesProfileSection[];
  readonly sources: readonly SpeciesProfileSource[];
}

export interface SpeciesProfileReference {
  readonly id: SpeciesProfileId;
  readonly displayName: string;
  readonly scientificName?: string;
  readonly status: SpeciesProfileStatus;
}

export function requirePublishedSpeciesProfile(
  profile: SpeciesProfileReference,
): SpeciesProfileReference {
  if (profile.status !== 'published') {
    throw new Error('Species Profile is not published');
  }
  return profile;
}
