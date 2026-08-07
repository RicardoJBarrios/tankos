export type AquariumId = string & { readonly __aquariumId: unique symbol };

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createAquariumId(): AquariumId {
  return crypto.randomUUID() as AquariumId;
}

export function aquariumIdFrom(value: string): AquariumId {
  if (!UUID_V4.test(value)) {
    throw new Error('AquariumId must be a UUID v4');
  }

  return value as AquariumId;
}
