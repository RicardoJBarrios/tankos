import { isUuidV4 } from './uuid-v4';
import { isParameterId, ParameterId } from './measurement';

export type AquariumTimeZone = string & {
  readonly __aquariumTimeZone: unique symbol;
};

export function aquariumTimeZoneFrom(value: string): AquariumTimeZone {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('Aquarium time zone must not be empty');
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: normalized }).format();
  } catch {
    throw new Error('Aquarium time zone must be a valid IANA time zone');
  }

  return normalized as AquariumTimeZone;
}

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

export interface AquariumLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;
}

export interface ParameterTarget {
  readonly parameterId: ParameterId;
  readonly minimum: number;
  readonly maximum: number;
}

export type ParameterTargets = Readonly<
  Partial<Record<ParameterId, ParameterTarget>>
>;

export const ParameterTarget = {
  create(input: ParameterTarget): ParameterTarget {
    if (!isParameterId(input.parameterId)) {
      throw new Error('Unsupported Parameter target');
    }

    if (!Number.isFinite(input.minimum) || !Number.isFinite(input.maximum)) {
      throw new Error('Parameter target values must be finite');
    }

    if (input.minimum < 0 || input.maximum < 0) {
      throw new Error('Parameter target values must not be negative');
    }

    if (input.minimum > input.maximum) {
      throw new Error('Parameter target minimum must not exceed maximum');
    }

    return { ...input };
  },
};

export function parameterTargetsFrom(
  targets: readonly ParameterTarget[],
): ParameterTargets {
  const result: Partial<Record<ParameterId, ParameterTarget>> = {};

  for (const target of targets) {
    const normalized = ParameterTarget.create(target);
    if (result[normalized.parameterId]) {
      throw new Error('Parameter target must be unique per Parameter');
    }
    result[normalized.parameterId] = normalized;
  }

  return result;
}

function roundLocationCoordinate(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const AquariumLocation = {
  create(input: AquariumLocation): AquariumLocation {
    if (
      !Number.isFinite(input.latitude) ||
      input.latitude < -90 ||
      input.latitude > 90
    ) {
      throw new Error('Aquarium latitude must be between -90 and 90');
    }

    if (
      !Number.isFinite(input.longitude) ||
      input.longitude < -180 ||
      input.longitude > 180
    ) {
      throw new Error('Aquarium longitude must be between -180 and 180');
    }

    const displayName = input.displayName.trim();
    if (!displayName) {
      throw new Error('Aquarium location display name must not be empty');
    }

    return {
      latitude: roundLocationCoordinate(input.latitude),
      longitude: roundLocationCoordinate(input.longitude),
      displayName,
    };
  },
};

export interface Aquarium {
  readonly id: AquariumId;
  readonly name: AquariumName;
  readonly ownerKeeperId: string;
  readonly establishedAt: Date;
  readonly timeZone?: AquariumTimeZone;
  readonly location?: AquariumLocation;
  readonly parameterTargets?: ParameterTargets;
}
