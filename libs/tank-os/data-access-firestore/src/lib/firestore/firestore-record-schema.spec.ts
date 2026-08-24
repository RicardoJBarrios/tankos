import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createFirestoreRecordSchema } from './firestore-record-schema';

describe('createFirestoreRecordSchema', () => {
  const schema = createFirestoreRecordSchema(z.strictObject({ name: z.string() }));

  it('Given a complete envelope, When parsed, Then preserves data and technical metadata', () => {
    const instant = Timestamp.fromMillis(0);
    const envelope = {
      data: { name: 'litre' },
      lifecycle: { status: 'active' as const },
      revision: 1,
      metadata: {
        schemaVersion: 1,
        createdAt: instant,
        updatedAt: instant,
        createdBy: 'admin',
        updatedBy: 'admin',
        lifecycleChangedAt: instant,
        lifecycleChangedBy: 'admin',
      },
    };

    expect(schema.parse(envelope)).toEqual(envelope);
  });

  it('Given an envelope with an unknown field, When parsed, Then rejects it', () => {
    expect(() =>
      schema.parse({
        data: { name: 'litre' },
        lifecycle: { status: 'active' },
        revision: 1,
        metadata: {
          schemaVersion: 1,
          createdAt: Timestamp.fromMillis(0),
          updatedAt: Timestamp.fromMillis(0),
        },
        extra: true,
      }),
    ).toThrow();
  });
});
