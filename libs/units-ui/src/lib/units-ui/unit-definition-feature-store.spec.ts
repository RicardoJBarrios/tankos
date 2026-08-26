import {
  createEntityId,
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
  quantityKind: 'alkalinity',
  conversionFamily: 'alkalinity',
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
        draft,
      });
    });
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

    feature.markForDeletion(record);
    await vi.waitFor(() => {
      expect(service.markForDeletionSpy).toHaveBeenCalled();
    });
    feature.restore(record);
    await vi.waitFor(() => {
      expect(service.restoreSpy).toHaveBeenCalled();
    });
    feature.list.loadMore();

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

    feature.markForDeletion(createRecord());

    await vi.waitFor(() => {
      expect(feature.lifecycleError()).toBe(failure);
    });
    expect(feature.lifecycleStatus()).toBe('error');
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
    feature.list.loadMore();
    expect(feature.list.error()).toBeUndefined();
    await vi.waitFor(() => {
      expect(feature.list.error()).toBe(failure);
    });
  });

  function createService(): UnitDefinitionManagementService & {
    saveSpy: ReturnType<typeof vi.fn>;
    listSpy: ReturnType<typeof vi.fn>;
    markForDeletionSpy: ReturnType<typeof vi.fn>;
    restoreSpy: ReturnType<typeof vi.fn>;
  } {
    const listSpy = vi.fn(() => Promise.resolve({ items: [], hasMore: false }));
    const saveSpy = vi.fn(() => Promise.resolve(createRecord()));
    const markForDeletionSpy = vi.fn(() => Promise.resolve(createRecord()));
    const restoreSpy = vi.fn(() => Promise.resolve(createRecord()));
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
