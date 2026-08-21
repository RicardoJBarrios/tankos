import { createEntityId, type CrudRepositoryPort } from '../core';
import type { CrudRecord, ListRequest, Page } from '../core';
import { createCrudService } from './crud-service';

describe('createCrudService', () => {
  type Data = { readonly name: string };
  type Create = { readonly name: string };
  type Update = { readonly name: string };
  type Filter = { readonly name?: string };

  const id = createEntityId('record-1');
  const record: CrudRecord<Data> = {
    id,
    data: { name: 'record' },
    lifecycle: { status: 'active' },
    version: 1,
  };
  const page: Page<CrudRecord<Data>> = {
    items: [record],
    hasMore: false,
  };
  const request: ListRequest<Filter> = {
    page: { pageSize: 20 },
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
    const command = { id };
    const create = { name: 'new' };
    const update = { name: 'updated' };

    await service.get(command);
    await service.create(create);
    await service.replace(command, update);
    await service.markForDeletion(command);
    await service.restore(command);
    await service.delete(command);

    expect(dependency.calls).toEqual({
      get: [command],
      create: [create],
      replace: [command, update],
      markForDeletion: [command],
      restore: [command],
      delete: [command],
    });
  });
});
