import type { EntityId } from './entity-id';

/** Provider-neutral UTC instant shape compatible with TankOS Time. */
export interface ServerTimestamp {
  readonly kind: 'instant';
  readonly epochMilliseconds: number;
}

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
}
