import { AquariumId } from './aquarium';
import { isUuidV4 } from './uuid-v4';

export type ObservationId = string & {
  readonly __observationId: unique symbol;
};

export function createObservationId(): ObservationId {
  return crypto.randomUUID() as ObservationId;
}

export function observationIdFrom(value: string): ObservationId {
  if (!isUuidV4(value)) {
    throw new Error('ObservationId must be a UUID v4');
  }

  return value as ObservationId;
}

export interface Observation {
  readonly id: ObservationId;
  readonly aquariumId: AquariumId;
  readonly content: string;
  readonly recordedAt: Date;
}

export function createObservation(input: {
  readonly id: ObservationId;
  readonly aquariumId: AquariumId;
  readonly content: string;
  readonly recordedAt: Date;
}): Observation {
  const content = input.content.trim();

  if (!content) {
    throw new Error('Observation content must not be empty');
  }

  if (Number.isNaN(input.recordedAt.getTime())) {
    throw new Error('Observation recordedAt must be a valid date');
  }

  return { ...input, content };
}
