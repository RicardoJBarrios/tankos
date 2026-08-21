import { InjectionToken } from '@angular/core';
import type { BatchOperationPort, CrudRepositoryPort } from '../../core';

/** Injection token for the host application's entity repository adapter. */
export const CRUD_REPOSITORY = new InjectionToken<
  CrudRepositoryPort<unknown, unknown, unknown>
>('TANK_OS_CRUD_REPOSITORY');

/** Injection token for the host application's asynchronous batch adapter. */
export const BATCH_OPERATION_PORT = new InjectionToken<BatchOperationPort>(
  'TANK_OS_BATCH_OPERATION_PORT',
);
