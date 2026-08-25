import {
  AquariumId,
  AquariumTimeZone,
} from '../../shared/domain/aquarium-reference';
import { Observation, ObservationId } from '../domain/observation';
import { Page } from '../../shared/application/pagination';
export type { KeeperSession } from '../../shared/application/keeper-session';

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

export type ObservationCursor = string & {
  readonly __observationCursor: unique symbol;
};

export type ObservationPage = Page<ObservationListItem, ObservationCursor>;

export interface ObservationReader {
  listOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    cursor?: ObservationCursor,
    pageSize?: number,
  ): Promise<ObservationPage>;
}

export interface TimelineObservationReader {
  listRecentOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    limit: number,
  ): Promise<readonly ObservationListItem[]>;
}

export interface ObservationAquariumContextReader {
  getOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
  ): Promise<{ readonly timeZone?: AquariumTimeZone } | null>;
}
