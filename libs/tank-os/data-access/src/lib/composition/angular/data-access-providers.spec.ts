import { TestBed } from '@angular/core/testing';
import type { BatchOperationPort, CrudRepositoryPort } from '../../core';
import { provideTankOsDataAccess } from './data-access-providers';
import { BATCH_OPERATION_PORT, CRUD_REPOSITORY } from './data-access-tokens';

describe('provideTankOsDataAccess', () => {
  it('Given CRUD and batch adapters, When composed in Angular, Then registers both ports', () => {
    const crudRepository = {} as CrudRepositoryPort<unknown, unknown, unknown>;
    const batchOperation = {} as BatchOperationPort;

    TestBed.configureTestingModule({
      providers: [provideTankOsDataAccess({ crudRepository, batchOperation })],
    });

    expect(TestBed.inject(CRUD_REPOSITORY)).toBe(crudRepository);
    expect(TestBed.inject(BATCH_OPERATION_PORT)).toBe(batchOperation);
  });
});
