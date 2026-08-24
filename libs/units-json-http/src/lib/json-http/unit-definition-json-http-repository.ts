import {
  createJsonHttpCrudRepository,
  type JsonHttpCrudRepositoryOptions,
} from '@tankos/data-access-json-http';
import type { CrudRepositoryPort } from '@tankos/data-access';
import type { UnitDefinition, UnitDefinitionFilter } from '@tankos/units';
import { unitDefinitionSchema, unitDefinitionToDto } from '@tankos/units-zod';
import type { JsonHttpTimeAdapter } from '@tankos/time-json-http';
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
    schemas: createUnitsJsonHttpRecordSchemas(
      unitDefinitionSchema,
      options.time,
    ),
    serializeCreate: unitDefinitionToDto,
    serializeUpdate: unitDefinitionToDto,
  });
}

/** Exported DTO schema for consumers that need to validate a raw unit payload. */
export { unitDefinitionDtoSchema } from '@tankos/units-zod';
