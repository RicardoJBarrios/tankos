import { AquariumId } from '../../shared/domain/aquarium-reference';
import { isUuidV4 } from '../../shared/domain/uuid-v4';

export type SpeciesProfileId = string;

export type LivestockId = string & { readonly __livestockId: unique symbol };

export function createLivestockId(): LivestockId {
  return crypto.randomUUID() as LivestockId;
}

export function livestockIdFrom(value: string): LivestockId {
  if (!isUuidV4(value)) throw new Error('Livestock ID must be a UUID v4');
  return value as LivestockId;
}

export type LivestockRepresentation = 'individual' | 'group';
export type LivestockCategory = 'fish' | 'coral' | 'other';
export type LivestockLifecycle = 'active' | 'removed';

export interface Livestock {
  readonly id: LivestockId;
  readonly speciesProfileId: SpeciesProfileId;
  readonly aquariumId: AquariumId;
  readonly category: LivestockCategory;
  readonly representation: LivestockRepresentation;
  readonly displayName: string;
  readonly lifecycle: LivestockLifecycle;
  readonly associatedAt: Date;
  readonly updatedAt: Date;
}

export function createLivestock(
  input: Omit<Livestock, 'lifecycle'>,
): Livestock {
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error('Livestock display name must not be empty');
  if (Number.isNaN(input.associatedAt.getTime()))
    throw new Error('Livestock associatedAt must be a valid date');
  if (Number.isNaN(input.updatedAt.getTime()))
    throw new Error('Livestock updatedAt must be a valid date');
  return { ...input, displayName, lifecycle: 'active' };
}

export function transferLivestock(
  livestock: Livestock,
  aquariumId: AquariumId,
  updatedAt: Date,
): Livestock {
  if (livestock.lifecycle !== 'active')
    throw new Error('Removed Livestock cannot be transferred');
  if (Number.isNaN(updatedAt.getTime()))
    throw new Error('Livestock updatedAt must be a valid date');
  return { ...livestock, aquariumId, updatedAt };
}

export function removeLivestock(
  livestock: Livestock,
  updatedAt: Date,
): Livestock {
  if (livestock.lifecycle !== 'active')
    throw new Error('Livestock is already removed');
  if (Number.isNaN(updatedAt.getTime()))
    throw new Error('Livestock updatedAt must be a valid date');
  return { ...livestock, lifecycle: 'removed', updatedAt };
}
