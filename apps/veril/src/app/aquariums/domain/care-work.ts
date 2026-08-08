import { AquariumId } from './aquarium';
import { isUuidV4 } from './uuid-v4';

export type CareWorkId = string & {
  readonly __careWorkId: unique symbol;
};

export function createCareWorkId(): CareWorkId {
  return crypto.randomUUID() as CareWorkId;
}

export function careWorkIdFrom(value: string): CareWorkId {
  if (!isUuidV4(value)) {
    throw new Error('CareWorkId must be a UUID v4');
  }

  return value as CareWorkId;
}

export interface CareWork {
  readonly id: CareWorkId;
  readonly aquariumId: AquariumId;
  readonly description: string;
  readonly performedAt: Date;
  readonly recordedAt: Date;
  readonly provenance: 'manual';
}

export function createCareWork(input: {
  readonly id: CareWorkId;
  readonly aquariumId: AquariumId;
  readonly description: string;
  readonly performedAt: Date;
  readonly recordedAt: Date;
  readonly provenance: 'manual';
}): CareWork {
  const description = input.description.trim();

  if (!description) {
    throw new Error('Care Work description must not be empty');
  }

  if (Number.isNaN(input.performedAt.getTime())) {
    throw new Error('Care Work performedAt must be a valid date');
  }

  if (Number.isNaN(input.recordedAt.getTime())) {
    throw new Error('Care Work recordedAt must be a valid date');
  }

  return { ...input, description };
}
