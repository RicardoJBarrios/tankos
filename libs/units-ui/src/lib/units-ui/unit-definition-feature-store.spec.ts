import {
  createEntityId,
  createPageCursor,
  type AccessContext,
  type CrudRecord,
} from '@tankos/data-access';
import { describe, expect, it, vi } from 'vitest';
import {
  createCustomUnitDefinition,
  type UnitDefinition,
  type UnitDefinitionManagementService,
} from '@tankos/units';
import {
  createUnitDefinitionFeatureStore,
  formatUnitDefinitionLabel,
} from './unit-definition-feature-store';

const access: AccessContext = {
  principalId: createEntityId('keeper-1'),
  roles: ['keeper'],
};
const draft = {
  code: 'TANKOS:CUSTOM-ALK',
  symbol: 'dKH',
  asciiFallback: 'dKH',
};

const authSession = {
  access: vi.fn(() => Promise.resolve(access)),
  refresh: vi.fn(() => Promise.resolve(access)),
  signIn: vi.fn(),
  signOut: vi.fn(),
};

describe('unit definition feature store', () => {
  it('saves a new definition and reloads the list', async () => {
    const service = createService();
    const feature = createUnitDefinitionFeatureStore(service, authSession);

    feature.save(draft);

    await vi.waitFor(() => {
      expect(service.saveSpy).toHaveBeenCalledWith({ access, draft });
      expect(service.listSpy).toHaveBeenCalled();
    });
    expect(feature.editingRecord()).toBeUndefined();
  });

  it('saves an edited definition as a new version', async () => {
    const service = createService();
    const feature = createUnitDefinitionFeatureStore(service, authSession);
    const record = createRecord();
    feature.startEdit(record);

    feature.save(draft);

    await vi.waitFor(() => {
      expect(service.saveSpy).toHaveBeenCalledWith({
        access,
        id: record.id,
        expectedRevision: record.revision,
        current: record.data,
        draft,
      });
    });
  });

  it('requests deleted records with the restricted lifecycle filter', async () => {
    const service = createService();
    const feature = createUnitDefinitionFeatureStore(service, authSession);

    await feature.list.load({ lifecycle: 'marked-for-deletion' });

    expect(service.listSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        lifecycle: ['marked-for-deletion'],
      }),
    );
  });

  it('starts and cancels creation mode', () => {
    const feature = createUnitDefinitionFeatureStore(
      createService(),
      authSession,
    );
    const record = createRecord();

    feature.startEdit(record);
    feature.startCreate();
    expect(feature.editingRecord()).toBeUndefined();
    feature.startEdit(record);
    feature.cancelEdit();
    expect(feature.editingRecord()).toBeUndefined();
  });

  it('delegates lifecycle actions to the generic list store', async () => {
    const service = createService();
    const feature = createUnitDefinitionFeatureStore(service, authSession);
    const record = createRecord();

    void feature.markForDeletion(record);
    await vi.waitFor(() => {
      expect(service.markForDeletionSpy).toHaveBeenCalled();
    });
    void feature.restore(record);
    void feature.publish(record);
    void feature.delete(record);
    await vi.waitFor(() => {
      expect(service.restoreSpy).toHaveBeenCalled();
      expect(service.publishSpy).toHaveBeenCalled();
      expect(service.deleteSpy).toHaveBeenCalled();
    });
    void feature.list.loadMore();

    expect(service.markForDeletionSpy).toHaveBeenCalledWith({
      access,
      id: record.id,
      expectedRevision: record.revision,
    });
    expect(service.restoreSpy).toHaveBeenCalledWith({
      access,
      id: record.id,
      expectedRevision: record.revision,
    });
    expect(service.publishSpy).toHaveBeenCalledWith({
      access,
      id: record.id,
      expectedRevision: record.revision,
      current: record.data,
      currentLifecycle: record.lifecycle.status,
    });
    expect(service.deleteSpy).toHaveBeenCalledWith({
      access,
      id: record.id,
      expectedRevision: record.revision,
    });
  });

  it('records save failures and exposes the domain label', async () => {
    const service = createService();
    const failure = new Error('offline');
    service.saveSpy.mockRejectedValueOnce(failure);
    const feature = createUnitDefinitionFeatureStore(service, authSession);

    feature.save(draft);
    await vi.waitFor(() => {
      expect(feature.saveError()).toBe(failure);
    });
    expect(feature.saveStatus()).toBe('error');
    expect(formatUnitDefinitionLabel(createRecord())).toContain('dKH');
  });

  it('records lifecycle failures as reactive state', async () => {
    const service = createService();
    const failure = new Error('offline');
    service.markForDeletionSpy.mockRejectedValueOnce(failure);
    const feature = createUnitDefinitionFeatureStore(service, authSession);

    void feature.markForDeletion(createRecord());

    await vi.waitFor(() => {
      expect(feature.lifecycleError()).toBe(failure);
    });
    expect(feature.lifecycleStatus()).toBe('error');

    const restoreFailure = new Error('restore-offline');
    service.restoreSpy.mockRejectedValueOnce(restoreFailure);
    void feature.restore(createRecord());
    await vi.waitFor(() => {
      expect(feature.lifecycleError()).toBe(restoreFailure);
    });

    const publishFailure = new Error('publish-offline');
    service.publishSpy.mockRejectedValueOnce(publishFailure);
    void feature.publish(createRecord());
    await vi.waitFor(() => {
      expect(feature.lifecycleError()).toBe(publishFailure);
    });

    const deleteFailure = new Error('delete-offline');
    service.deleteSpy.mockRejectedValueOnce(deleteFailure);
    void feature.delete(createRecord());
    await vi.waitFor(() => {
      expect(feature.lifecycleError()).toBe(deleteFailure);
    });
  });

  it('exposes session failures through the list signals', async () => {
    const failure = new Error('session expired');
    const failingAuthSession = {
      access: vi.fn(() => Promise.reject(failure)),
      refresh: vi.fn(() => Promise.reject(failure)),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
    const feature = createUnitDefinitionFeatureStore(
      createService(),
      failingAuthSession,
    );

    expect(feature.list.status()).toBe('idle');
    expect(feature.list.error()).toBeUndefined();
    void feature.list.load();
    await vi.waitFor(() => {
      expect(feature.list.status()).toBe('error');
      expect(feature.list.error()).toBe(failure);
    });
    void feature.list.loadMore();
    expect(feature.list.error()).toBeUndefined();
    await vi.waitFor(() => {
      expect(feature.list.error()).toBe(failure);
    });
  });

  it('exposes failures while loading another page', async () => {
    const service = createService();
    service.listSpy.mockResolvedValueOnce({
      items: [],
      hasMore: true,
      nextCursor: createPageCursor('next'),
    });
    const feature = createUnitDefinitionFeatureStore(service, authSession);
    await feature.list.load();

    const failure = new Error('next page unavailable');
    service.listSpy.mockRejectedValueOnce(failure);
    await feature.list.loadMore();

    expect(feature.list.status()).toBe('error');
    expect(feature.list.error()).toBe(failure);
  });

  function createService(): UnitDefinitionManagementService & {
    saveSpy: ReturnType<typeof vi.fn>;
    listSpy: ReturnType<typeof vi.fn>;
    markForDeletionSpy: ReturnType<typeof vi.fn>;
    restoreSpy: ReturnType<typeof vi.fn>;
    publishSpy: ReturnType<typeof vi.fn>;
    deleteSpy: ReturnType<typeof vi.fn>;
  } {
    const listSpy = vi.fn(() => Promise.resolve({ items: [], hasMore: false }));
    const saveSpy = vi.fn(() => Promise.resolve(createRecord()));
    const markForDeletionSpy = vi.fn(() => Promise.resolve(createRecord()));
    const restoreSpy = vi.fn(() => Promise.resolve(createRecord()));
    const publishSpy = vi.fn(() => Promise.resolve(createRecord()));
    const deleteSpy = vi.fn(() => Promise.resolve());
    return {
      list: listSpy,
      get: vi.fn(() => Promise.resolve(undefined)),
      create: vi.fn(),
      save: saveSpy,
      replace: vi.fn(),
      markForDeletion: markForDeletionSpy,
      restore: restoreSpy,
      delete: vi.fn(),
      saveSpy,
      listSpy,
      markForDeletionSpy,
      restoreSpy,
      publish: publishSpy,
      publishSpy,
      delete: deleteSpy,
      deleteSpy,
    };
  }

  function createRecord(): CrudRecord<UnitDefinition> {
    return {
      id: createEntityId('unit-1'),
      data: createCustomUnitDefinition(draft),
      lifecycle: { status: 'active' },
      revision: 3,
      metadata: {
        schemaVersion: 1,
        createdAt: { kind: 'instant', epochMilliseconds: 0 },
        updatedAt: { kind: 'instant', epochMilliseconds: 0 },
      },
    };
  }
});
