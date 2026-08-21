import * as publicApi from './index';

describe('TankOS Data Access public entry point', () => {
  it('Given the public entry point, When imported, Then exposes core, application and Angular composition contracts', () => {
    expect(publicApi.createEntityId).toEqual(expect.any(Function));
    expect(publicApi.createCrudService).toEqual(expect.any(Function));
    expect(publicApi.createBatchService).toEqual(expect.any(Function));
    expect(publicApi.provideTankOsDataAccess).toEqual(expect.any(Function));
    expect(publicApi.CRUD_REPOSITORY).toBeDefined();
    expect(publicApi.BATCH_OPERATION_PORT).toBeDefined();
  });
});
