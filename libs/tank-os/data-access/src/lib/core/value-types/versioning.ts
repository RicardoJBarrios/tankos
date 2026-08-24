import type { CrudRecord } from './crud-record';
import type { EntityId } from './entity-id';
import type { RecordCommand } from './crud-request';

/** Record envelope for business contracts whose versions are immutable. */
export interface VersionedRecord<TData> extends CrudRecord<TData> {
  /** Stable identity of this immutable version. */
  readonly versionId: EntityId;
  /** Human-readable sequential business version number. */
  readonly versionNumber: number;
}

/** Port for immutable version creation and lifecycle transitions. */
export interface VersionedRepositoryPort<TData, TUpdate> {
  createVersion(
    request: RecordCommand,
    input: TUpdate,
  ): Promise<VersionedRecord<TData>>;
  deprecate(request: RecordCommand): Promise<VersionedRecord<TData>>;
  retire(request: RecordCommand): Promise<VersionedRecord<TData>>;
}
