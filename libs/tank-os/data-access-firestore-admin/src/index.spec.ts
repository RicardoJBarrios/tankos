import * as publicApi from './index';

describe('data-access-firestore-admin public API', () => {
  it('Given the package entry point, When imported, Then exposes both Firestore batch adapters', () => {
    expect(publicApi.createFirestoreAdminAtomicBatch).toBeTypeOf('function');
    expect(publicApi.createFirestoreAdminBatchStore).toBeTypeOf('function');
    expect(publicApi.createFirestoreAdminBatchExecutor).toBeTypeOf('function');
  });
});
