import type { EntityId } from './entity-id';
import type { Instant } from '@tank-os/time';

/** Server timestamp represented by the workspace-wide Time contract. */
export type ServerTimestamp = Instant;

/** Server-owned metadata required to interpret a persisted record. */
export interface RecordMetadata {
  /** Technical validation schema used by this record. */
  readonly schemaVersion: number;
  /** Server timestamp at creation. */
  readonly createdAt: ServerTimestamp;
  /** Server timestamp of the latest normal lifecycle change. */
  readonly updatedAt: ServerTimestamp;
  /** Actor that created the record, when the persistence boundary knows it. */
  readonly createdBy?: EntityId;
  /** Actor that performed the latest normal lifecycle change. */
  readonly updatedBy?: EntityId;
  /** Server timestamp of the latest lifecycle transition, when distinct. */
  readonly lifecycleChangedAt?: ServerTimestamp;
  /** Actor that performed the latest lifecycle transition. */
  readonly lifecycleChangedBy?: EntityId;
}
