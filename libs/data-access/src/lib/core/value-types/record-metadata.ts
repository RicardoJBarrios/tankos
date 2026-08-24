import type { EntityId } from './entity-id';
import type { Instant } from '@tankos/time';

/** Technical persistence timestamp represented by the workspace-wide Time contract. */
export type TechnicalTimestamp = Instant;

/** Technical metadata required to interpret a persisted record. */
export interface RecordMetadata {
  /** Technical validation schema used by this record. */
  readonly schemaVersion: number;
  /** Technical persistence timestamp at creation. */
  readonly createdAt: TechnicalTimestamp;
  /** Technical persistence timestamp of the latest normal lifecycle change. */
  readonly updatedAt: TechnicalTimestamp;
  /** Actor that created the record, when the persistence boundary knows it. */
  readonly createdBy?: EntityId;
  /** Actor that performed the latest normal lifecycle change. */
  readonly updatedBy?: EntityId;
  /** Technical timestamp of the latest lifecycle transition, when distinct. */
  readonly lifecycleChangedAt?: TechnicalTimestamp;
  /** Actor that performed the latest lifecycle transition. */
  readonly lifecycleChangedBy?: EntityId;
}
