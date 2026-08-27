import {
  createFirestoreCrudRepository,
  createFirestoreRecordSchema,
  type FirestoreCrudRepositoryOptions,
} from '@tankos/data-access-firestore';
import type { CrudRepositoryPort } from '@tankos/data-access';
import { type UnitDefinition, type UnitDefinitionFilter } from '@tankos/units';
import {
  unitDefinitionDtoSchema,
  unitDefinitionSchema,
  unitDefinitionToDto,
  type UnitDefinitionDto,
} from '@tankos/units-zod';
import { createMappedFirestoreCrudRepository } from './mapped-firestore-crud-repository';

/** Firestore repository options for the public and private unit catalogue. */
export type UnitDefinitionFirestoreRepositoryOptions = Omit<
  FirestoreCrudRepositoryOptions<
    UnitDefinitionDto,
    UnitDefinition,
    UnitDefinition,
    UnitDefinitionFilter
  >,
  'recordSchema' | 'createData' | 'updateData'
>;

/** Creates the unit CRUD port implementation backed by Firestore. */
export function createUnitDefinitionFirestoreRepository(
  options: UnitDefinitionFirestoreRepositoryOptions,
): CrudRepositoryPort<
  UnitDefinition,
  UnitDefinition,
  UnitDefinition,
  UnitDefinitionFilter
> {
  const repository = createFirestoreCrudRepository<
    UnitDefinitionDto,
    UnitDefinition,
    UnitDefinition,
    UnitDefinitionFilter
  >({
    ...options,
    recordSchema: unitDefinitionRecordSchema,
    createData: (input, id) => ({
      ...unitDefinitionToDto(input),
      storageId: id,
    }),
    updateData: (_data, input, id) => ({
      ...unitDefinitionToDto(input),
      storageId: id,
    }),
  });

  return createMappedFirestoreCrudRepository(repository, (value) =>
    unitDefinitionSchema.parse(value),
  );
}

/** Strict Firestore envelope schema for unit-definition records. */
export const unitDefinitionRecordSchema = createFirestoreRecordSchema(
  unitDefinitionDtoSchema,
);
