import {
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import type { BatchOperationPort, CrudRepositoryPort } from '../../core';
import { BATCH_OPERATION_PORT, CRUD_REPOSITORY } from './data-access-tokens';

/** Dependencies supplied by a host application when composing the library. */
export interface DataAccessProviderOptions {
  readonly crudRepository: CrudRepositoryPort<unknown, unknown, unknown>;
  readonly batchOperation: BatchOperationPort;
}

/** Registers provider-specific CRUD and batch ports for Angular consumers. */
export function provideTankOsDataAccess(
  options: DataAccessProviderOptions,
): EnvironmentProviders {
  const providers: Provider[] = [
    { provide: CRUD_REPOSITORY, useValue: options.crudRepository },
    { provide: BATCH_OPERATION_PORT, useValue: options.batchOperation },
  ];

  return makeEnvironmentProviders(providers);
}
