import {
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import type {
  BatchOperationPort,
  CacheInvalidationPort,
  CrudRepositoryPort,
} from '../../core';
import { createCrudService } from '../../application';
import {
  BATCH_OPERATION_PORT,
  CACHE_INVALIDATION_PORT,
  createCrudRepositoryToken,
  createCrudServiceToken,
} from './data-access-tokens';

/** Dependencies supplied by a host application when composing the library. */
export interface DataAccessProviderOptions {
  readonly batchOperation: BatchOperationPort;
}

/** Registers provider-specific CRUD and batch ports for Angular consumers. */
export function provideTankOsDataAccess(
  options: DataAccessProviderOptions,
): EnvironmentProviders {
  const providers: Provider[] = [
    { provide: BATCH_OPERATION_PORT, useValue: options.batchOperation },
  ];

  return makeEnvironmentProviders(providers);
}

/** Registers the host application's scoped cache invalidation port. */
export function provideCacheInvalidation(
  invalidation: CacheInvalidationPort,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CACHE_INVALIDATION_PORT, useValue: invalidation },
  ]);
}

/** Registers one typed repository token in an Angular environment. */
export function provideCrudRepository<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
>(
  token: ReturnType<typeof createCrudRepositoryToken<TData, TCreate, TUpdate, TFilter>>,
  repository: CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>,
): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: token, useValue: repository }]);
}

/** Registers a typed CRUD service using Angular's `inject()` factory. */
export function provideCrudService<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
>(
  serviceToken: ReturnType<typeof createCrudServiceToken<TData, TCreate, TUpdate, TFilter>>,
  repositoryToken: ReturnType<typeof createCrudRepositoryToken<TData, TCreate, TUpdate, TFilter>>,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: serviceToken,
      useFactory: () => createCrudService(inject(repositoryToken)),
    },
  ]);
}
