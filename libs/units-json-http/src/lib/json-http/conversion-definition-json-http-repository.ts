import {
  createJsonHttpCrudRepository,
  type JsonHttpCrudRepositoryOptions,
} from '@tankos/data-access-json-http';
import type { CrudRepositoryPort } from '@tankos/data-access';
import type {
  ConversionDefinition,
  ConversionDefinitionFilter,
} from '@tankos/units';
import {
  conversionDefinitionSchema,
  conversionDefinitionToDto,
} from '@tankos/units-zod';
import type { JsonHttpTimeAdapter } from '@tankos/time-json-http';
import { createUnitsJsonHttpRecordSchemas } from './json-http-record-schemas';

/** Options for the JSON/HTTP conversion-definition repository. */
export type ConversionDefinitionJsonHttpRepositoryOptions = Omit<
  JsonHttpCrudRepositoryOptions<
    ConversionDefinition,
    ConversionDefinition,
    ConversionDefinition,
    ConversionDefinitionFilter
  >,
  'schemas' | 'serializeCreate' | 'serializeUpdate'
> & { readonly time: JsonHttpTimeAdapter };

/** Creates a provider-neutral conversion repository backed by JSON/HTTP. */
export function createConversionDefinitionJsonHttpRepository(
  options: ConversionDefinitionJsonHttpRepositoryOptions,
): CrudRepositoryPort<
  ConversionDefinition,
  ConversionDefinition,
  ConversionDefinition,
  ConversionDefinitionFilter
> {
  return createJsonHttpCrudRepository({
    ...options,
    schemas: createUnitsJsonHttpRecordSchemas(
      conversionDefinitionSchema,
      options.time,
    ),
    serializeCreate: conversionDefinitionToDto,
    serializeUpdate: conversionDefinitionToDto,
  });
}

/** Exported DTO schema for consumers that need to validate a raw conversion payload. */
export { conversionDefinitionDtoSchema } from '@tankos/units-zod';
