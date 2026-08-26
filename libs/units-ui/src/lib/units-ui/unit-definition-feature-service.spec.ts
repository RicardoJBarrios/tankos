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
      quantityKind: 'custom',
      conversionFamily: 'custom',
    });
    service.markForDeletion(record);
    service.restore(record);

    await vi.waitFor(() => {
      expect(service.list.items()).toHaveLength(0);
      expect(management.saveSpy).toHaveBeenCalled();
      expect(management.markForDeletionSpy).toHaveBeenCalled();
      expect(management.restoreSpy).toHaveBeenCalled();
    });
  });

  function createManagementService(
    record: CrudRecord<UnitDefinition>,
  ): UnitDefinitionManagementService & {
    saveSpy: ReturnType<typeof vi.fn>;
    markForDeletionSpy: ReturnType<typeof vi.fn>;
    restoreSpy: ReturnType<typeof vi.fn>;
  } {
    const saveSpy = vi.fn(() => Promise.resolve(record));
    const markForDeletionSpy = vi.fn(() => Promise.resolve(record));
    const restoreSpy = vi.fn(() => Promise.resolve(record));
    return {
      list: vi.fn(() => Promise.resolve({ items: [], hasMore: false })),
      get: vi.fn(() => Promise.resolve(record)),
      create: vi.fn(() => Promise.resolve(record)),
      save: saveSpy,
      replace: vi.fn(() => Promise.resolve(record)),
      markForDeletion: markForDeletionSpy,
      restore: restoreSpy,
      delete: vi.fn(() => Promise.resolve()),
      saveSpy,
      markForDeletionSpy,
      restoreSpy,
    };
  }

  function createRecord(): CrudRecord<UnitDefinition> {
    return {
      id: createEntityId('unit-1'),
      data: createCustomUnitDefinition({
        code: 'TANKOS:CUSTOM',
        symbol: 'u',
        asciiFallback: 'u',
        quantityKind: 'custom',
        conversionFamily: 'custom',
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
