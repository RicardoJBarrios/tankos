import { z } from 'zod';
import { createEntityId } from '@tank-os/data-access';
import { createJsonHttpCrudRepository } from './json-http-crud-repository';

describe('createJsonHttpCrudRepository', () => {
  const instant = { kind: 'instant' as const, epochMilliseconds: 0 };
  const record = {
    id: createEntityId('unit-1'),
    data: { name: 'litre' },
    lifecycle: { status: 'active' as const },
    revision: 1,
    metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
  };
  const schema = z.object({
    id: z.string(),
    data: z.object({ name: z.string() }),
    lifecycle: z.object({ status: z.string() }),
    revision: z.number(),
    metadata: z.object({
      schemaVersion: z.number(),
      createdAt: z.object({
        kind: z.literal('instant'),
        epochMilliseconds: z.number(),
      }),
      updatedAt: z.object({
        kind: z.literal('instant'),
        epochMilliseconds: z.number(),
      }),
    }),
  });
  const pageSchema = z.object({ items: z.array(schema), hasMore: z.boolean() });
  const access = {
    principalId: createEntityId('keeper'),
    roles: ['keeper'] as const,
  };

  it('Given a valid JSON response, When listed, Then validates and maps the page', async () => {
    const request = vi
      .fn()
      .mockResolvedValue({ items: [record], hasMore: false });
    const repository = createJsonHttpCrudRepository({
      client: { request },
      baseUrl: '/api',
      schemas: { record: schema, page: pageSchema },
      serializeCreate: (input) => input,
      serializeUpdate: (input) => input,
      listUrl: () => '/units',
      recordUrl: (id) => `/units/${id}`,
    });

    await expect(
      repository.list({
        access,
        page: { pageSize: 20, orderBy: [{ field: 'id', direction: 'asc' }] },
      }),
    ).resolves.toEqual({ items: [record], hasMore: false });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/api/units',
        access,
      }),
    );
  });

  it('Given malformed JSON, When read, Then rejects at the transport boundary', async () => {
    const repository = createJsonHttpCrudRepository({
      client: { request: async () => ({ invalid: true }) },
      baseUrl: '/api',
      schemas: { record: schema, page: pageSchema },
      serializeCreate: (input) => input,
      serializeUpdate: (input) => input,
      listUrl: () => '/units',
      recordUrl: (id) => `/units/${id}`,
    });

    await expect(
      repository.get({ access, id: createEntityId('unit-1') }),
    ).rejects.toThrow();
  });

  it.each([undefined, null])(
    'Given an empty HTTP record response (%s), When read, Then returns no record',
    async (response) => {
      const repository = createJsonHttpCrudRepository({
        client: { request: async () => response },
        baseUrl: '/api',
        schemas: { record: schema, page: pageSchema },
        serializeCreate: (input) => input,
        serializeUpdate: (input) => input,
        listUrl: () => '/units',
        recordUrl: (id) => `/units/${id}`,
      });

      await expect(
        repository.get({ access, id: createEntityId('missing') }),
      ).resolves.toBeUndefined();
    },
  );

  it('Given a create command, When sent, Then serializes its input and validates the response', async () => {
    const request = vi.fn().mockResolvedValue(record);
    const repository = createJsonHttpCrudRepository({
      client: { request },
      baseUrl: '/api',
      schemas: { record: schema, page: pageSchema },
      serializeCreate: (input: { name: string }) => ({ label: input.name }),
      serializeUpdate: (input) => input,
      listUrl: () => '/units',
      recordUrl: (id) => `/units/${id}`,
    });

    await repository.create({
      access: { ...access, requestId: 'create-unit-2' },
      input: { name: 'litre' },
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        body: { label: 'litre' },
      }),
    );
  });

  it('Given a mutation request id, When sent over HTTP, Then forwards it as an idempotency key', async () => {
    const request = vi.fn().mockResolvedValue(record);
    const repository = createJsonHttpCrudRepository({
      client: { request },
      baseUrl: '/api',
      schemas: { record: schema, page: pageSchema },
      serializeCreate: (input) => input,
      serializeUpdate: (input) => input,
      listUrl: () => '/units',
      recordUrl: (id) => `/units/${id}`,
    });

    await repository.create({
      access: { ...access, requestId: 'create-unit-1' },
      input: { name: 'litre' },
    });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: 'create-unit-1' }),
    );
  });
});
