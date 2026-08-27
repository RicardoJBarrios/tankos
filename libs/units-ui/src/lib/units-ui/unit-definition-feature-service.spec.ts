import { createEntityId, type CrudRecord } from '@tankos/data-access';
import { describe, expect, it, vi } from 'vitest';
import {
  createCustomUnitDefinition,
  type UnitDefinition,
  type UnitDefinitionManagementService,
} from '@tankos/units';
import { UnitDefinitionFeatureService } from './unit-definition-feature-service';

describe('UnitDefinitionFeatureService', () => {
  it('orchestrates the feature without exposing its store', async () => {
    const record = createRecord();
    const management = createManagementService(record);
    const authSession = {
      access: vi.fn(() =>
        Promise.resolve({
          principalId: createEntityId('keeper'),
          roles: ['keeper'],
        }),
      ),
      refresh: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
    const service = new UnitDefinitionFeatureService(management, authSession);

    service.load();
    service.startCreate();
    service.startEdit(record);
    service.cancelEdit();
    service.save({
      code: 'TANKOS:CUSTOM',
      symbol: 'u',
      asciiFallback: 'u',
    });
    void service.markForDeletion(record);
    void service.restore(record);
    void service.publish(record);
    void service.delete(record);

    await vi.waitFor(() => {
      expect(service.list.items()).toHaveLength(0);
      expect(management.saveSpy).toHaveBeenCalled();
      expect(management.markForDeletionSpy).toHaveBeenCalled();
      expect(management.restoreSpy).toHaveBeenCalled();
      expect(management.publishSpy).toHaveBeenCalled();
      expect(management.deleteSpy).toHaveBeenCalled();
    });
  });

  it('loads a record for the detail and editor pages', async () => {
    const record = createRecord();
    const management = createManagementService(record);
    const authSession = createAuthSession();
    const service = new UnitDefinitionFeatureService(management, authSession);

    service.loadRecord(record.id);

    await vi.waitFor(() => {
      expect(service.recordStatus()).toBe('ready');
      expect(service.selectedRecord()).toBe(record);
      expect(management.getSpy).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        access: expect.anything(),
        id: record.id,
      });
    });
  });

  it('loads deleted records for an admin detail page', async () => {
    const record = createRecord();
    const management = createManagementService(record);
    const authSession = createAuthSession(['admin']);
    const service = new UnitDefinitionFeatureService(management, authSession);

    service.loadRecord(record.id);

    await vi.waitFor(() => {
      expect(management.getSpy).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        access: expect.anything(),
        id: record.id,
        lifecycle: ['active', 'inactive', 'marked-for-deletion'],
      });
    });
  });

  it('exposes record-not-found and access failures', async () => {
    const management = createManagementService(createRecord());
    const authSession = createAuthSession();
    const service = new UnitDefinitionFeatureService(management, authSession);

    management.getSpy.mockResolvedValueOnce(undefined);
    service.loadRecord('missing');
    await vi.waitFor(() => {
      expect(service.recordStatus()).toBe('error');
    });
    expect(service.recordError()).toBeInstanceOf(Error);

    const failure = new Error('offline');
    authSession.accessSpy.mockRejectedValueOnce(failure);
    service.loadRecord('unavailable');
    await vi.waitFor(() => {
      expect(service.recordError()).toBe(failure);
    });
    expect(service.recordStatus()).toBe('error');
  });

  function createAuthSession(roles: readonly string[] = ['keeper']) {
    const accessSpy = vi.fn(() =>
      Promise.resolve({
        principalId: createEntityId('keeper'),
        roles,
      }),
    );
    return {
      access: accessSpy,
      accessSpy,
      refresh: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
  }

  function createManagementService(
    record: CrudRecord<UnitDefinition>,
  ): UnitDefinitionManagementService & {
    saveSpy: ReturnType<typeof vi.fn>;
    getSpy: ReturnType<typeof vi.fn>;
    markForDeletionSpy: ReturnType<typeof vi.fn>;
    restoreSpy: ReturnType<typeof vi.fn>;
    publishSpy: ReturnType<typeof vi.fn>;
    deleteSpy: ReturnType<typeof vi.fn>;
  } {
    const saveSpy = vi.fn(() => Promise.resolve(record));
    const getSpy = vi.fn(() => Promise.resolve(record));
    const markForDeletionSpy = vi.fn(() => Promise.resolve(record));
    const restoreSpy = vi.fn(() => Promise.resolve(record));
    const publishSpy = vi.fn(() => Promise.resolve(record));
    const deleteSpy = vi.fn(() => Promise.resolve());
    return {
      list: vi.fn(() => Promise.resolve({ items: [], hasMore: false })),
      get: getSpy,
      create: vi.fn(() => Promise.resolve(record)),
      save: saveSpy,
      replace: vi.fn(() => Promise.resolve(record)),
      markForDeletion: markForDeletionSpy,
      restore: restoreSpy,
      publish: publishSpy,
      delete: vi.fn(() => Promise.resolve()),
      saveSpy,
      getSpy,
      markForDeletionSpy,
      restoreSpy,
      publishSpy,
      delete: deleteSpy,
      deleteSpy,
    };
  }

  function createRecord(): CrudRecord<UnitDefinition> {
    return {
      id: createEntityId('unit-1'),
      data: createCustomUnitDefinition({
        code: 'TANKOS:CUSTOM',
        symbol: 'u',
        asciiFallback: 'u',
      }),
      lifecycle: { status: 'active' },
      revision: 1,
      metadata: {
        schemaVersion: 1,
        createdAt: { kind: 'instant', epochMilliseconds: 0 },
        updatedAt: { kind: 'instant', epochMilliseconds: 0 },
      },
    };
  }
});
