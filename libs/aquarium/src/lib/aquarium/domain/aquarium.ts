const MAX_AQUARIUM_NAME_LENGTH = 120;

export type AquariumId = string & { readonly __aquariumId: unique symbol };

export function createAquariumId(value: string): AquariumId {
  const normalized = value.trim();
  if (!normalized) throw new Error('Aquarium id cannot be empty');
  return normalized as AquariumId;
}

export type AquariumName = string & {
  readonly __aquariumName: unique symbol;
};

export function createAquariumName(value: string): AquariumName {
  const normalized = value.trim();
  if (!normalized) throw new Error('Aquarium name cannot be empty');
  if (normalized.length > MAX_AQUARIUM_NAME_LENGTH)
    throw new Error(
      `Aquarium name cannot exceed ${String(MAX_AQUARIUM_NAME_LENGTH)} characters`,
    );
  return normalized as AquariumName;
}

/**
 * Minimal aggregate contract. Access memberships and permissions belong to
 * the authorization boundary and are deliberately not embedded here.
 */
export interface Aquarium {
  readonly id: AquariumId;
  readonly name: AquariumName;
  readonly establishedByKeeperId: string;
  readonly establishedAt: Date;
}
