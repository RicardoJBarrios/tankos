import type { CrudRecord } from '@tankos/data-access';
import type { UnitDefinition } from '../core';

/** Persisted unit-definition record used by the units application boundary. */
export type UnitDefinitionRecord = CrudRecord<UnitDefinition>;
