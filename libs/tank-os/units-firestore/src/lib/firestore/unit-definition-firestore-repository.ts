import {
  createFirestoreCrudRepository,
  createFirestoreRecordSchema,
  type FirestoreCrudRepositoryOptions,
} from '@tank-os/data-access-firestore';
import type {
  CrudRecord,
  CrudRepositoryPort,
  Page,
} from '@tank-os/data-access';
import {
  type UnitDefinition,
  type UnitDefinitionFilter,
} from '@tank-os/units';
import {
  unitDefinitionDtoSchema,
  unitDefinitionSchema,
  unitDefinitionToDto,
  type UnitDefinitionDto,
} from '@tank-os/units-zod';

/** Firestore repository options for the global unit-definition catalogue. */
export type UnitDefinitionFirestoreRepositoryOptions = Omit<
  FirestoreCrudRepositoryOptions<
    UnitDefinitionDto,
    UnitDefinition,
    UnitDefinition,
    UnitDefinitionFilter
  >,
  'recordSchema' | 'createData' | 'updateData'
>;

/** Creates a provider-neutral unit CRUD port backed by Firestore. */
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
    createData: unitDefinitionToDto,
    updateData: (_data, input) => unitDefinitionToDto(input),
  });

  return {
    list: async (request) => mapPage(await repository.list(request)),
    get: async (request) => mapRecord(await repository.get(request)),
    create: async (request) => mapRequiredRecord(await repository.create(request)),
    replace: async (request, input) =>
      mapRequiredRecord(await repository.replace(request, input)),
    markForDeletion: async (request) =>
      mapRequiredRecord(await repository.markForDeletion(request)),
    restore: async (request) => mapRequiredRecord(await repository.restore(request)),
    delete: (request) => repository.delete(request),
  };
}

/** Strict Firestore envelope schema for unit-definition records. */
export const unitDefinitionRecordSchema = createFirestoreRecordSchema(
  unitDefinitionDtoSchema,
);

function mapRecord(
  record: CrudRecord<UnitDefinitionDto> | undefined,
): CrudRecord<UnitDefinition> | undefined {
  return record
    ? { ...record, data: unitDefinitionSchema.parse(record.data) }
    : undefined;
}

function mapRequiredRecord(
  record: CrudRecord<UnitDefinitionDto>,
): CrudRecord<UnitDefinition> {
  return mapRecord(record) as CrudRecord<UnitDefinition>;
}

function mapPage(page: Page<CrudRecord<UnitDefinitionDto>>): Page<CrudRecord<UnitDefinition>> {
  return { ...page, items: page.items.map(mapRequiredRecord) };
}
