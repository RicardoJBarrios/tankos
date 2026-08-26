import {
  createFirestoreCrudRepository,
  createFirestoreRecordSchema,
  type FirestoreCrudRepositoryOptions,
} from '@tankos/data-access-firestore';
import type {
  ConversionDefinition,
  ConversionDefinitionFilter,
} from '@tankos/units';
import type { CrudRepositoryPort } from '@tankos/data-access';
import {
  conversionDefinitionDtoSchema,
  conversionDefinitionSchema,
  conversionDefinitionToDto,
  type ConversionDefinitionDto,
} from '@tankos/units-zod';
import { createMappedFirestoreCrudRepository } from './mapped-firestore-crud-repository';

/** Firestore repository options for the global conversion catalogue. */
export type ConversionDefinitionFirestoreRepositoryOptions = Omit<
  FirestoreCrudRepositoryOptions<
    ConversionDefinitionDto,
    ConversionDefinition,
    ConversionDefinition,
    ConversionDefinitionFilter
  >,
  'recordSchema' | 'createData' | 'updateData'
>;

/** Creates the conversion CRUD port implementation backed by Firestore. */
export function createConversionDefinitionFirestoreRepository(
  options: ConversionDefinitionFirestoreRepositoryOptions,
): CrudRepositoryPort<
  ConversionDefinition,
  ConversionDefinition,
  ConversionDefinition,
  ConversionDefinitionFilter
> {
  const repository = createFirestoreCrudRepository<
    ConversionDefinitionDto,
    ConversionDefinition,
    ConversionDefinition,
    ConversionDefinitionFilter
  >({
    ...options,
    recordSchema: conversionDefinitionRecordSchema,
    createData: conversionDefinitionToDto,
    updateData: (_data, input) => conversionDefinitionToDto(input),
  });

  return createMappedFirestoreCrudRepository(repository, (value) =>
    conversionDefinitionSchema.parse(value),
  );
}

/** Strict Firestore envelope schema for conversion-definition records. */
export const conversionDefinitionRecordSchema = createFirestoreRecordSchema(
  conversionDefinitionDtoSchema,
);
