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
