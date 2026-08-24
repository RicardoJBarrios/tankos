import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

const technicalTimestampSchema = z.instanceof(Timestamp);

const selectionSchema = z.union([
  z.object({ kind: z.literal('ids'), ids: z.array(z.string().min(1)) }),
  z.object({ kind: z.literal('filter'), filter: z.unknown() }),
]);

/** Runtime schema for Firestore Admin batch summaries. */
export const firestoreAdminBatchDtoSchema = z.object({
  batchId: z.string().min(1),
  principalId: z.string().min(1),
  schema: z.string().min(1),
  operation: z.enum(['update', 'mark-for-deletion', 'delete']),
  status: z.enum([
    'materializing',
    'queued',
    'running',
    'interrupted',
    'completed',
    'completed-with-warnings',
    'failed',
    'cancelled',
  ]),
  total: z.number().int().nonnegative(),
  processed: z.number().int().nonnegative(),
  warnings: z.number().int().nonnegative(),
  failures: z.number().int().nonnegative(),
  retryCount: z.number().int().nonnegative(),
  currentChunk: z.string().min(1).optional(),
  createdAt: technicalTimestampSchema,
  updatedAt: technicalTimestampSchema,
  selection: z.object({
    fingerprint: z.string().min(1),
    total: z.number().int().nonnegative(),
    chunkCount: z.number().int().nonnegative(),
  }),
  requestedSelection: selectionSchema.optional(),
  payload: z.unknown().optional(),
  requestFingerprint: z.string().min(1),
  cancellationRequested: z.boolean().optional(),
  idempotencyKey: z.string().min(1).optional(),
  leaseOwner: z.string().min(1).nullable().optional(),
  leaseToken: z.string().min(1).nullable().optional(),
  leaseUntil: technicalTimestampSchema.nullable().optional(),
  materializationLeaseOwner: z.string().min(1).nullable().optional(),
  materializationLeaseToken: z.string().min(1).nullable().optional(),
  materializationLeaseUntil: technicalTimestampSchema.nullable().optional(),
});

/** Runtime schema for one persisted batch chunk. */
export const firestoreAdminBatchChunkSchema = z.object({
  chunkId: z.string().min(1),
  ids: z.array(z.string().min(1)),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  attempts: z.number().int().nonnegative(),
  succeeded: z.number().int().nonnegative().optional(),
  warnings: z.number().int().nonnegative().optional(),
  failures: z.number().int().nonnegative().optional(),
});
