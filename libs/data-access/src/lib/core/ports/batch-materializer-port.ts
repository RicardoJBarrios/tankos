import type { BatchSelection, EntityId } from '../value-types';

/** Safety limits supplied to a materializer by the application boundary. */
export interface BatchMaterializationOptions {
  readonly maxTargets: number;
}

/** Trusted provider query that freezes a logical selection into stable IDs. */
export interface BatchMaterializerPort<TFilter = unknown> {
  /** Resolves the submitted selection to the immutable target ids for execution. */
  materialize(
    selection: BatchSelection<TFilter>,
    options: BatchMaterializationOptions,
  ): Promise<readonly EntityId[]>;
}
