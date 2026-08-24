import { createEntityId } from '@tank-os/data-access';
import { createJsonHttpTimeAdapter } from '@tank-os/time-json-http';
import { createNativeTimeAdapter } from '@tank-os/time';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createUnitsJsonHttpRecordSchemas } from './json-http-record-schemas';

describe('createUnitsJsonHttpRecordSchemas', () => {
  const time = createJsonHttpTimeAdapter(createNativeTimeAdapter());
  const schemas = createUnitsJsonHttpRecordSchemas(
    z.strictObject({ name: z.string() }),
    time,
  );
  const record = {
    id: 'unit-1',
    data: { name: 'litre' },
    lifecycle: { status: 'active' as const },
    revision: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: '2026-08-20T15:30:00Z',
      updatedAt: '2026-08-20T15:30:00Z',
      createdBy: 'admin',
      updatedBy: 'admin',
      lifecycleChangedAt: '2026-08-20T15:30:00Z',
      lifecycleChangedBy: 'admin',
    },
  };

  it('Given a valid record, When parsed, Then maps transport values to domain values', () => {
    const parsed = schemas.record.parse(record);

    expect(parsed).toMatchObject({
      id: createEntityId('unit-1'),
      data: { name: 'litre' },
      metadata: {
        createdAt: { kind: 'instant' },
        createdBy: createEntityId('admin'),
      },
    });
  });

  it('Given a valid page, When parsed, Then maps every record and preserves pagination', () => {
    const page = schemas.page.parse({
      items: [record],
      nextCursor: 'next',
      hasMore: true,
    });

    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBe('next');
    expect(page.hasMore).toBe(true);
  });

  it('Given an unknown record field, When parsed, Then rejects the response', () => {
    expect(() => schemas.record.parse({ ...record, unknown: true })).toThrow();
  });
});
