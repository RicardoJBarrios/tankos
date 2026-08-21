import type { EntityId } from './entity-id';
import type { LifecycleState } from './lifecycle';
import type { RecordMetadata } from './record-metadata';

/** Generic persisted record envelope owned by the shared data-access layer. */
export interface CrudRecord<TData> {
  readonly id: EntityId;
  readonly data: TData;
  readonly lifecycle: LifecycleState;
  readonly version: number;
  readonly metadata: RecordMetadata;
}
