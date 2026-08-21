import { InjectionToken } from '@angular/core';
import type { BatchOperationPort, CrudRepositoryPort } from '../../core';

/** Creates a typed token for one domain entity repository. */
export function createCrudRepositoryToken<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
>(description: string): InjectionToken<
  CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>
> {
  return new InjectionToken(description);
}

/** Creates a typed token for one domain entity application service. */
export function createCrudServiceToken<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
>(description: string): InjectionToken<
  import('../../application').CrudService<TData, TCreate, TUpdate, TFilter>
> {
  return new InjectionToken(description);
}

/** Injection token for the host application's asynchronous batch adapter. */
export const BATCH_OPERATION_PORT = new InjectionToken<BatchOperationPort>(
  'TANK_OS_BATCH_OPERATION_PORT',
);
