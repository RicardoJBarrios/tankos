import { z } from 'zod';
import { createEntityId } from '@tankos/data-access';
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

  function repositoryWith(request: ReturnType<typeof vi.fn>) {
    return createJsonHttpCrudRepository({
      client: { request },
      baseUrl: '/api',
      schemas: { record: schema, page: pageSchema },
      serializeCreate: (input: { name: string }) => ({ label: input.name }),
      serializeUpdate: (input: { name: string }) => ({ label: input.name }),
      listUrl: () => '/units',
      recordUrl: (id) => `/units/${id}`,
    });
  }

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

  it('Given a mutation without a request id, When sent over HTTP, Then rejects before transport access', async () => {
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

    await expect(
      repository.create({ access, input: { name: 'litre' } }),
    ).rejects.toThrow('requestId');
    expect(request).not.toHaveBeenCalled();
  });

  it('Given an existing record, When fetched, Then validates and returns the record', async () => {
    const request = vi.fn().mockResolvedValue(record);

    await expect(
      repositoryWith(request).get({ access, id: record.id }),
    ).resolves.toEqual(record);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: `/api/units/${record.id}`,
      }),
    );
  });

  it('Given a replace command, When sent, Then sends its payload and revision', async () => {
    const request = vi.fn().mockResolvedValue(record);

    await repositoryWith(request).replace(
      {
        access: { ...access, requestId: 'replace-unit-1' },
        id: record.id,
        expectedRevision: 1,
      },
      { name: 'litre' },
    );

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        body: { input: { label: 'litre' }, expectedRevision: 1 },
      }),
    );
  });

  it.each([
    ['markForDeletion', 'mark-for-deletion'],
    ['restore', 'restore'],
  ] as const)(
    'Given a lifecycle command, When %s is sent, Then uses the lifecycle endpoint',
    async (method, action) => {
      const request = vi.fn().mockResolvedValue(record);

      await repositoryWith(request)[method]({
        access: { ...access, requestId: `${method}-unit-1` },
        id: record.id,
        expectedRevision: 1,
      });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: `/api/units/${record.id}/${action}`,
          body: { expectedRevision: 1 },
        }),
      );
    },
  );

  it('Given a delete command, When sent, Then sends the expected revision', async () => {
    const request = vi.fn().mockResolvedValue(undefined);

    await repositoryWith(request).delete({
      access: { ...access, requestId: 'delete-unit-1' },
      id: record.id,
      expectedRevision: 1,
    });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: `/api/units/${record.id}`,
        body: { expectedRevision: 1 },
      }),
    );
  });

  it.each([
    [
      'replace',
      (repository: ReturnType<typeof repositoryWith>) =>
        repository.replace(
          {
            access: { ...access, requestId: 'replace-unit-2' },
            id: record.id,
            expectedRevision: 0.5,
          },
          { name: 'litre' },
        ),
    ],
    [
      'delete',
      (repository: ReturnType<typeof repositoryWith>) =>
        repository.delete({
          access: { ...access, requestId: 'delete-unit-2' },
          id: record.id,
          expectedRevision: Number.NaN,
        }),
    ],
  ] as const)(
    'Given an invalid revision, When %s is sent, Then rejects before transport access',
    async (_method, operation) => {
      const request = vi.fn().mockResolvedValue(record);

      await expect(operation(repositoryWith(request))).rejects.toThrow(
        'expectedRevision',
      );
      expect(request).not.toHaveBeenCalled();
    },
  );
});
