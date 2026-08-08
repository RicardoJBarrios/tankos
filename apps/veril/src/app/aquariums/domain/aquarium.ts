import { isUuidV4 } from './uuid-v4';

export type AquariumId = string & { readonly __aquariumId: unique symbol };

export function createAquariumId(): AquariumId {
  return crypto.randomUUID() as AquariumId;
}

export function aquariumIdFrom(value: string): AquariumId {
  if (!isUuidV4(value)) {
    throw new Error('AquariumId must be a UUID v4');
  }

  return value as AquariumId;
}

export class AquariumName {
  private constructor(readonly value: string) {}

  static create(value: string): AquariumName {
    const normalized = value.trim();

    if (!normalized) {
      throw new Error('AquariumName cannot be empty');
    }

    return new AquariumName(normalized);
  }
}

export interface Aquarium {
  readonly id: AquariumId;
  readonly name: AquariumName;
  readonly ownerKeeperId: string;
  readonly establishedAt: Date;
}
