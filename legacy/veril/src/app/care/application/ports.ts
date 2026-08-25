import {
  AquariumId,
  AquariumTimeZone,
} from '../../shared/domain/aquarium-reference';
import { CareWork, CareWorkId } from '../domain/care-work';
import {
  PlannedCareWork,
  PlannedCareWorkId,
} from '../domain/planned-care-work';
import {
  RecurringCarePlan,
  RecurringCarePlanId,
} from '../domain/recurring-care-plan';
import { Page } from '../../shared/application/pagination';
export type { KeeperSession } from '../../shared/application/keeper-session';

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
export type CareWorkCursor = string & {
  readonly __careWorkCursor: unique symbol;
};
export type CareWorkPage = Page<CareWorkListItem, CareWorkCursor>;
export interface CareWorkReader {
  listRecentOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    cursor?: CareWorkCursor,
    pageSize?: number,
  ): Promise<CareWorkPage>;
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
export type PlannedCareWorkCursor = string & {
  readonly __plannedCareWorkCursor: unique symbol;
};
export type PlannedCareWorkPage = Page<
  PlannedCareWorkListItem,
  PlannedCareWorkCursor
>;
export interface PlannedCareWorkReader {
  listOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    cursor?: PlannedCareWorkCursor,
    pageSize?: number,
  ): Promise<PlannedCareWorkPage>;
}

export interface CareAquariumContextReader {
  getOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
  ): Promise<{ readonly timeZone?: AquariumTimeZone } | null>;
}
