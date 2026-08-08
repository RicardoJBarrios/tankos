import { Aquarium } from '../domain/aquarium';
import { AquariumId } from '../domain/aquarium-id';
import { AquariumName } from '../domain/aquarium-name';
import {
  Measurement,
  MeasurementId,
  ParameterId,
  UnitId,
} from '../domain/measurement';
import { Observation, ObservationId } from '../domain/observation';

export interface AquariumListItem {
  readonly id: AquariumId;
  readonly name: AquariumName;
}

export interface KeeperSession {
  requireAuthenticatedKeeper(): Promise<{ readonly id: string }>;
}

export interface AquariumReader {
  listOwned(ownerKeeperId: string): Promise<readonly AquariumListItem[]>;
  getOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
  ): Promise<AquariumListItem | null>;
}

export interface EstablishAquariumInput {
  readonly id: AquariumId;
  readonly name: AquariumName;
  readonly ownerKeeperId: string;
  readonly establishedAt: Date;
}

export interface AquariumRepository {
  establish(input: EstablishAquariumInput): Promise<Aquarium>;
}

export interface RecordObservationInput {
  readonly id: ObservationId;
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly content: string;
  readonly recordedAt: Date;
}

export interface ObservationWriter {
  record(input: RecordObservationInput): Promise<Observation>;
}

export interface RecordMeasurementInput {
  readonly id: MeasurementId;
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly parameterId: ParameterId;
  readonly enteredValue: number;
  readonly enteredUnit: UnitId;
  readonly canonicalValue: number;
  readonly canonicalUnit: UnitId;
  readonly measuredAt: Date;
  readonly recordedAt: Date;
  readonly provenance: 'manual';
}

export interface MeasurementWriter {
  record(input: RecordMeasurementInput): Promise<Measurement>;
}
