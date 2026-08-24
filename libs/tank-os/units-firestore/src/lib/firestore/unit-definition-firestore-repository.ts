import {
  createFirestoreCrudRepository,
  type FirestoreCrudRepositoryOptions,
  type FirestoreRecordDto,
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
import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

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
export const unitDefinitionRecordSchema = createRecordSchema(
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

function createRecordSchema<T>(
  dataSchema: z.ZodType<T>,
): z.ZodType<FirestoreRecordDto<T>> {
  return z.strictObject({
    data: dataSchema,
    lifecycle: z.strictObject({
      status: z.enum(['active', 'inactive', 'marked-for-deletion', 'deleted']),
    }),
    revision: z.number().int().min(1),
    metadata: z.strictObject({
      schemaVersion: z.number().int().min(1),
      createdAt: z.instanceof(Timestamp),
      updatedAt: z.instanceof(Timestamp),
      createdBy: z.string().optional(),
      updatedBy: z.string().optional(),
      lifecycleChangedAt: z.instanceof(Timestamp).optional(),
      lifecycleChangedBy: z.string().optional(),
    }),
  }) as z.ZodType<FirestoreRecordDto<T>>;
}
