import { Timestamp } from 'firebase/firestore';
import type { FirestoreRecordDto } from './firestore-crud-repository';
import { z } from 'zod';

/** Creates the strict persistence-envelope schema shared by Firestore entities. */
export function createFirestoreRecordSchema<T>(
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
