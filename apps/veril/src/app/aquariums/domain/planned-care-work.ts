import { AquariumId } from './aquarium';
import { isUuidV4 } from './uuid-v4';

export type PlannedCareWorkId = string & {
  readonly __plannedCareWorkId: unique symbol;
};

export function createPlannedCareWorkId(): PlannedCareWorkId {
  return crypto.randomUUID() as PlannedCareWorkId;
}

export function plannedCareWorkIdFrom(value: string): PlannedCareWorkId {
  if (!isUuidV4(value)) {
    throw new Error('PlannedCareWorkId must be a UUID v4');
  }

  return value as PlannedCareWorkId;
}

export interface PlannedCareWork {
  readonly id: PlannedCareWorkId;
  readonly aquariumId: AquariumId;
  readonly description: string;
  readonly plannedFor: Date;
  readonly recordedAt: Date;
  readonly provenance: 'manual';
}

export function createPlannedCareWork(input: {
  readonly id: PlannedCareWorkId;
  readonly aquariumId: AquariumId;
  readonly description: string;
  readonly plannedFor: Date;
  readonly recordedAt: Date;
  readonly provenance: 'manual';
}): PlannedCareWork {
  const description = input.description.trim();

  if (!description) {
    throw new Error('Planned Care Work description must not be empty');
  }

  if (Number.isNaN(input.plannedFor.getTime())) {
    throw new Error('Planned Care Work plannedFor must be a valid date');
  }

  if (Number.isNaN(input.recordedAt.getTime())) {
    throw new Error('Planned Care Work recordedAt must be a valid date');
  }

  return { ...input, description };
}
