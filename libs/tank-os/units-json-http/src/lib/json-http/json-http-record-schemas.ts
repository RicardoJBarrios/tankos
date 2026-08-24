import type { CrudRecord, Page } from '@tank-os/data-access';
import type { JsonHttpTimeAdapter } from '@tank-os/time-json-http';
import { createEntityId } from '@tank-os/data-access';
import { z } from 'zod';

/** Schemas required by the shared JSON/HTTP CRUD repository. */
export interface UnitsJsonHttpRecordSchemas<TData> {
  readonly record: z.ZodType<CrudRecord<TData>>;
  readonly page: z.ZodType<Page<CrudRecord<TData>>>;
}

/** Creates the strict JSON/HTTP record and page schemas for unit entities. */
export function createUnitsJsonHttpRecordSchemas<TData>(
  dataSchema: z.ZodType<TData>,
  time: JsonHttpTimeAdapter,
): UnitsJsonHttpRecordSchemas<TData> {
  const instantSchema = z.unknown().transform((value) =>
    time.deserializeInstant(value),
  );
  const recordSchema = z.strictObject({
    id: z.string().min(1).transform(createEntityId),
    data: dataSchema,
    lifecycle: z.strictObject({
      status: z.enum(['active', 'inactive', 'marked-for-deletion', 'deleted']),
    }),
    revision: z.number().int().min(1),
    metadata: z.strictObject({
      schemaVersion: z.number().int().min(1),
      createdAt: instantSchema,
      updatedAt: instantSchema,
      createdBy: z.string().min(1).transform(createEntityId).optional(),
      updatedBy: z.string().min(1).transform(createEntityId).optional(),
      lifecycleChangedAt: instantSchema.optional(),
      lifecycleChangedBy: z.string().min(1).transform(createEntityId).optional(),
    }),
  }) as z.ZodType<CrudRecord<TData>>;

  return {
    record: recordSchema,
    page: z.strictObject({
      items: z.array(recordSchema),
      nextCursor: z.string().min(1).optional(),
      hasMore: z.boolean(),
    }) as z.ZodType<Page<CrudRecord<TData>>>,
  };
}
