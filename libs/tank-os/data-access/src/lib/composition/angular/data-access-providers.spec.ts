import { TestBed } from '@angular/core/testing';
import type { BatchOperationPort } from '../../core';
import {
  provideCacheInvalidation,
  provideCrudRepository,
  provideCrudService,
  provideTankOsDataAccess,
} from './data-access-providers';
import {
  BATCH_OPERATION_PORT,
  CACHE_INVALIDATION_PORT,
  createCrudRepositoryToken,
  createCrudServiceToken,
} from './data-access-tokens';

describe('provideTankOsDataAccess', () => {
  it('Given CRUD and batch adapters, When composed in Angular, Then registers both ports', () => {
    const batchOperation = {} as BatchOperationPort;

    TestBed.configureTestingModule({
      providers: [provideTankOsDataAccess({ batchOperation })],
    });

    expect(TestBed.inject(BATCH_OPERATION_PORT)).toBe(batchOperation);
  });

  it('Given one entity repository, When composed with typed tokens, Then injects its typed CRUD service', async () => {
    type Data = { readonly name: string };
    const repository = {
      list: async () => ({ items: [], hasMore: false }),
      get: async () => undefined,
      create: async (input: Data) => input,
      replace: async () => undefined,
      markForDeletion: async () => undefined,
      restore: async () => undefined,
      delete: async () => undefined,
    } as never;
    const repositoryToken = createCrudRepositoryToken<Data, Data, Data>(
      'TEST_REPOSITORY',
    );
    const serviceToken = createCrudServiceToken<Data, Data, Data>(
      'TEST_SERVICE',
    );

    TestBed.configureTestingModule({
      providers: [
        provideCrudRepository(repositoryToken, repository),
        provideCrudService(serviceToken, repositoryToken),
      ],
    });

    await expect(
      TestBed.inject(serviceToken).create({
        access: { principalId: 'keeper' as never, roles: ['keeper'] },
        input: { name: 'typed' },
      }),
    ).resolves.toEqual({
      access: { principalId: 'keeper', roles: ['keeper'] },
      input: { name: 'typed' },
    });
  });
});

describe('provideCacheInvalidation', () => {
  it('Given a scoped invalidation port, When composed in Angular, Then registers it', () => {
    const invalidation = {
      clear: async () => undefined,
      clearAll: async () => undefined,
    };

    TestBed.configureTestingModule({
      providers: [provideCacheInvalidation(invalidation)],
    });

    expect(TestBed.inject(CACHE_INVALIDATION_PORT)).toBe(invalidation);
  });
});
