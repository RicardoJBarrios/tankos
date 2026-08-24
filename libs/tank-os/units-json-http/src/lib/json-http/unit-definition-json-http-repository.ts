import {
  createJsonHttpCrudRepository,
  type JsonHttpCrudRepositoryOptions,
} from '@tank-os/data-access-json-http';
import type { CrudRepositoryPort } from '@tank-os/data-access';
import type { UnitDefinition, UnitDefinitionFilter } from '@tank-os/units';
import {
  unitDefinitionSchema,
  unitDefinitionToDto,
} from '@tank-os/units-zod';
import type { JsonHttpTimeAdapter } from '@tank-os/time-json-http';
import { createUnitsJsonHttpRecordSchemas } from './json-http-record-schemas';

/** Options for the JSON/HTTP unit-definition repository. */
export type UnitDefinitionJsonHttpRepositoryOptions = Omit<
  JsonHttpCrudRepositoryOptions<
    UnitDefinition,
    UnitDefinition,
    UnitDefinition,
    UnitDefinitionFilter
  >,
  'schemas' | 'serializeCreate' | 'serializeUpdate'
> & { readonly time: JsonHttpTimeAdapter };

/** Creates a provider-neutral unit repository backed by JSON/HTTP. */
export function createUnitDefinitionJsonHttpRepository(
  options: UnitDefinitionJsonHttpRepositoryOptions,
): CrudRepositoryPort<
  UnitDefinition,
  UnitDefinition,
  UnitDefinition,
  UnitDefinitionFilter
> {
  return createJsonHttpCrudRepository({
    ...options,
    schemas: createUnitsJsonHttpRecordSchemas(unitDefinitionSchema, options.time),
    serializeCreate: unitDefinitionToDto,
    serializeUpdate: unitDefinitionToDto,
  });
}

/** Exported DTO schema for consumers that need to validate a raw unit payload. */
export { unitDefinitionDtoSchema } from '@tank-os/units-zod';
