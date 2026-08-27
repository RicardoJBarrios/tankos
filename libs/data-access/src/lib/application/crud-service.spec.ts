import { createEntityId, type CrudRepositoryPort } from '../core';
import type { CrudRecord, ListRequest, Page } from '../core';
import { createCrudService } from './crud-service';
import { vi } from 'vitest';

describe('createCrudService', () => {
  interface Data {
    readonly name: string;
  }
  interface Create {
    readonly name: string;
  }
  interface Update {
    readonly name: string;
  }
  interface Filter {
    readonly name?: string;
  }

  const id = createEntityId('record-1');
  const instant = { kind: 'instant' as const, epochMilliseconds: 0 };
  const record: CrudRecord<Data> = {
    id,
    data: { name: 'record' },
    lifecycle: { status: 'active' },
    revision: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: instant,
      updatedAt: instant,
    },
  };
  const page: Page<CrudRecord<Data>> = {
    items: [record],
    hasMore: false,
  };
  const request: ListRequest<Filter> = {
    access: { principalId: id, roles: ['keeper'] },
    page: {
      pageSize: 20,
      orderBy: [{ field: 'updatedAt', direction: 'desc' }],
    },
    filter: { name: 'record' },
  };

  function repository(): {
    port: CrudRepositoryPort<Data, Create, Update, Filter>;
    calls: Record<string, unknown[]>;
  } {
    const calls: Record<string, unknown[]> = {};
    const capture = (name: string, ...args: unknown[]) => {
      calls[name] = args;
    };

    return {
      calls,
      port: {
        list: async (...args) => {
          capture('list', ...args);
          return page;
        },
        get: async (...args) => {
          capture('get', ...args);
          return record;
        },
        create: async (...args) => {
          capture('create', ...args);
          return record;
        },
        replace: async (...args) => {
          capture('replace', ...args);
          return record;
        },
        markForDeletion: async (...args) => {
          capture('markForDeletion', ...args);
          return record;
        },
        restore: async (...args) => {
          capture('restore', ...args);
          return record;
        },
        delete: async (...args) => {
          capture('delete', ...args);
        },
      },
    };
  }

  it('Given a list request, When composed, Then delegates it to the repository', async () => {
    const dependency = repository();

    await expect(
      createCrudService(dependency.port).list(request),
    ).resolves.toBe(page);
    expect(dependency.calls.list).toEqual([request]);
  });

  it('Given a CRUD command, When composed, Then delegates each operation unchanged', async () => {
    const dependency = repository();
    const service = createCrudService(dependency.port);
    const command = {
      access: { principalId: id, roles: ['keeper'] as const },
      id,
      expectedRevision: 1,
    };
    const create = { name: 'new' };
    const update = { name: 'updated' };

    await service.get(command);
    await service.create({ access: command.access, input: create });
    await service.replace(command, update);
    await service.markForDeletion(command);
    await service.restore(command);
    await service.delete(command);

    expect(dependency.calls).toEqual({
      get: [
        {
          access: command.access,
          id: command.id,
          lifecycle: ['active', 'inactive', 'marked-for-deletion', 'deleted'],
        },
      ],
      create: [{ access: command.access, input: create }],
      replace: [command, update],
      markForDeletion: [command],
      restore: [command],
      delete: [command],
    });
  });

  it('Given a missing record, When reading, Then returns the repository result without authorizing it', async () => {
    const dependency = repository();
    dependency.port.get = async () => undefined;

    await expect(createCrudService(dependency.port).get(request)).resolves.toBe(
      undefined,
    );
  });

  it('skips update validation when a replacement target is missing', async () => {
    const dependency = repository();
    dependency.port.get = async () => undefined;
    const validateUpdate = async () => undefined;
    const service = createCrudService(dependency.port, {
      policy: { authorize: vi.fn(), validateUpdate },
    });
    await service.replace(
      { access: request.access, id, expectedRevision: 1 },
      { name: 'updated' },
    );
    expect(dependency.calls.replace).toBeDefined();
  });
});
