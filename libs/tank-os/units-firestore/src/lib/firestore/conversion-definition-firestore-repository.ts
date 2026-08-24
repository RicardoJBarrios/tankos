import {
  createFirestoreCrudRepository,
  createFirestoreRecordSchema,
  type FirestoreCrudRepositoryOptions,
} from '@tank-os/data-access-firestore';
import type {
  ConversionDefinition,
  ConversionDefinitionFilter,
} from '@tank-os/units';
import type { CrudRecord, CrudRepositoryPort, Page } from '@tank-os/data-access';
import {
  conversionDefinitionDtoSchema,
  conversionDefinitionSchema,
  conversionDefinitionToDto,
  type ConversionDefinitionDto,
} from '@tank-os/units-zod';

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

/** Creates a provider-neutral conversion CRUD port backed by Firestore. */
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

/** Strict Firestore envelope schema for conversion-definition records. */
export const conversionDefinitionRecordSchema = createFirestoreRecordSchema(
  conversionDefinitionDtoSchema,
);

function mapRecord(
  record: CrudRecord<ConversionDefinitionDto> | undefined,
): CrudRecord<ConversionDefinition> | undefined {
  return record
    ? { ...record, data: conversionDefinitionSchema.parse(record.data) }
    : undefined;
}

function mapRequiredRecord(
  record: CrudRecord<ConversionDefinitionDto>,
): CrudRecord<ConversionDefinition> {
  return mapRecord(record) as CrudRecord<ConversionDefinition>;
}

function mapPage(
  page: Page<CrudRecord<ConversionDefinitionDto>>,
): Page<CrudRecord<ConversionDefinition>> {
  return { ...page, items: page.items.map(mapRequiredRecord) };
}
