import {
  Aquarium,
  AquariumId,
  AquariumName,
  AquariumLocation,
  AquariumTimeZone,
} from '../domain/aquarium';
import {
  Measurement,
  MeasurementId,
  ParameterId,
  UnitId,
} from '../domain/measurement';
import { Observation, ObservationId } from '../domain/observation';
import { CareWork, CareWorkId } from '../domain/care-work';
import {
  PlannedCareWork,
  PlannedCareWorkId,
} from '../domain/planned-care-work';
import {
  RecurringCarePlan,
  RecurringCarePlanId,
} from '../domain/recurring-care-plan';

export interface AquariumListItem {
  readonly id: AquariumId;
  readonly name: AquariumName;
  readonly timeZone?: AquariumTimeZone;
  readonly location?: AquariumLocation;
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

export interface ConfigureAquariumTimeZoneInput {
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly timeZone: AquariumTimeZone;
}

export interface AquariumTimeZoneConfigurer {
  configure(input: ConfigureAquariumTimeZoneInput): Promise<AquariumTimeZone>;
}

export interface ConfigureAquariumLocationInput {
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly location: AquariumLocation;
}

export interface AquariumLocationConfigurer {
  configureLocation(
    input: ConfigureAquariumLocationInput,
  ): Promise<AquariumLocation>;
}

export interface LocationCandidate {
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;
  readonly country?: string;
  readonly region?: string;
  readonly suggestedTimeZone?: string;
}

export interface LocationSearch {
  search(query: string): Promise<readonly LocationCandidate[]>;
}

export interface LocalWeather {
  readonly currentTemperature: number;
  readonly todayMinTemperature: number;
  readonly todayMaxTemperature: number;
  readonly observedAt?: Date;
  readonly fetchedAt: Date;
}

export interface LocalWeatherReader {
  read(
    location: AquariumLocation,
    options?: { readonly forceRefresh?: boolean },
  ): Promise<LocalWeather>;
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

export interface ObservationListItem {
  readonly id: ObservationId;
  readonly content: string;
  readonly recordedAt: Date;
}

export interface ObservationReader {
  listOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
  ): Promise<readonly ObservationListItem[]>;
}

export interface TimelineObservationReader {
  listRecentOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    limit: number,
  ): Promise<readonly ObservationListItem[]>;
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

export type MeasurementCursor = string & {
  readonly __measurementCursor: unique symbol;
};

export interface MeasurementListItem {
  readonly id: MeasurementId;
  readonly parameterId: ParameterId;
  readonly canonicalValue: number;
  readonly canonicalUnit: UnitId;
  readonly measuredAt: Date;
  readonly recordedAt: Date;
  readonly provenance: 'manual';
}

export interface MeasurementPage {
  readonly items: readonly MeasurementListItem[];
  readonly nextCursor?: MeasurementCursor;
}

export interface MeasurementReader {
  listOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    cursor?: MeasurementCursor,
  ): Promise<MeasurementPage>;
}

export interface CurrentMeasurementValue {
  readonly parameterId: ParameterId;
  readonly canonicalValue: number | null;
  readonly canonicalUnit: UnitId | null;
  readonly measuredAt: Date | null;
}

export interface CurrentMeasurementReader {
  findCurrentOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    parameterId: ParameterId,
  ): Promise<MeasurementListItem | null>;
}

export interface TimelineMeasurementReader {
  listRecentOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    limit: number,
  ): Promise<readonly MeasurementListItem[]>;
}

export interface RecordCareWorkInput {
  readonly id: CareWorkId;
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly description: string;
  readonly performedAt: Date;
  readonly recordedAt: Date;
  readonly provenance: 'manual';
}

export interface CareWorkWriter {
  record(input: RecordCareWorkInput): Promise<CareWork>;
}

export interface CareWorkListItem {
  readonly id: CareWorkId;
  readonly description: string;
  readonly performedAt: Date;
  readonly recordedAt: Date;
}

export interface CareWorkReader {
  listRecentOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    limit: number,
  ): Promise<readonly CareWorkListItem[]>;
}

export interface PlanCareWorkInput {
  readonly id: PlannedCareWorkId;
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly description: string;
  readonly plannedFor: Date;
  readonly recordedAt: Date;
  readonly provenance: 'manual';
}

export interface PlannedCareWorkWriter {
  recordPlanned(input: PlanCareWorkInput): Promise<PlannedCareWork>;
}

export interface CompletePlannedCareWorkInput {
  readonly id: PlannedCareWorkId;
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly completedAt: Date;
}

export interface PlannedCareWorkCompleter {
  complete(input: CompletePlannedCareWorkInput): Promise<CareWork>;
}

export interface CancelPlannedCareWorkInput {
  readonly id: PlannedCareWorkId;
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly actionAt?: Date;
}

export interface PlannedCareWorkCanceller {
  cancel(input: CancelPlannedCareWorkInput): Promise<void>;
}

export interface EstablishWeeklyRecurringCareInput {
  readonly id: RecurringCarePlanId;
  readonly occurrenceId: PlannedCareWorkId;
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly description: string;
  readonly firstOccurrenceAt: Date;
  readonly recordedAt: Date;
  readonly timeZone: AquariumTimeZone;
}

export interface RecurringCarePlanWriter {
  establish(
    input: EstablishWeeklyRecurringCareInput,
  ): Promise<RecurringCarePlan>;
}

export interface RecurringCarePlanStopper {
  stop(input: {
    readonly id: RecurringCarePlanId;
    readonly aquariumId: AquariumId;
    readonly ownerKeeperId: string;
  }): Promise<void>;
}

export interface PlannedCareWorkListItem {
  readonly id: PlannedCareWorkId;
  readonly description: string;
  readonly plannedFor: Date;
  readonly recordedAt: Date;
  readonly provenance: 'manual' | 'recurring-plan';
  readonly recurringCarePlanId?: RecurringCarePlanId;
}

export interface PlannedCareWorkReader {
  listOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    limit: number,
  ): Promise<readonly PlannedCareWorkListItem[]>;
}
