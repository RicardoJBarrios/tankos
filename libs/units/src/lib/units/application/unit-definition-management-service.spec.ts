import { createEntityId, type CrudRepositoryPort } from '@tankos/data-access';
import { describe, expect, it, vi } from 'vitest';
import {
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
  type UnitDefinition,
  type UnitDefinitionFilter,
} from '../core';
import {
  createUnitDefinitionManagementService,
  createCustomUnitDefinition,
  type CustomUnitDefinitionDraft,
} from './unit-definition-management-service';

const draft: CustomUnitDefinitionDraft = {
  code: 'TANKOS:CUSTOM-ALK',
  symbol: 'dKH',
  asciiFallback: 'dKH',
};

describe('createUnitDefinitionManagementService', () => {
  it('creates a public definition when no owner is supplied', () => {
    const result = createCustomUnitDefinition(draft);
    expect(result).toMatchObject({ visibility: 'public' });
    expect(result).not.toHaveProperty('ownerId');
    expect(result).not.toHaveProperty('ownerName');
  });

  it('creates a validated custom definition from application input', async () => {
    const repository = createRepository();
    const service = createUnitDefinitionManagementService(repository);
    const access = {
      principalId: createEntityId('admin-1'),
      principalName: 'Admin One',
      roles: ['admin'],
    };

    const result = await service.save({ access, draft });

    expect(result.data).toMatchObject({
      code: 'TANKOS:CUSTOM-ALK',
      system: 'custom',
      ownerId: access.principalId,
      ownerName: access.principalName,
      visibility: 'private',
    });
    expect(repository.create).toHaveBeenCalledWith({
      access,
      input: result.data,
    });
  });

  it('creates a new version and retires the previous definition', async () => {
    const repository = createRepository();
    const service = createUnitDefinitionManagementService(repository);
    const access = { principalId: createEntityId('admin-1'), roles: ['admin'] };
    const id = createEntityId('unit-1');

    await service.save({ access, id, expectedRevision: 3, draft });

    expect(repository.create).toHaveBeenCalledWith({
      access: expect.objectContaining({
        ...access,
        requestId: 'unit-1:replacement:3',
      }),
      input: expect.objectContaining({ code: 'TANKOS:CUSTOM-ALK' }),
    });
    expect(repository.markForDeletion).toHaveBeenCalledWith({
      access,
      id,
      expectedRevision: 3,
    });
    expect(repository.replace).not.toHaveBeenCalled();
  });

  it('persists the custom unit display position and spacing', async () => {
    const repository = createRepository();
    const service = createUnitDefinitionManagementService(repository);
    const access = {
      principalId: createEntityId('keeper-1'),
      roles: ['keeper'],
    };

    await service.save({
      access,
      draft: { ...draft, position: 'prefix', spacing: 'none' },
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          representation: expect.objectContaining({
            position: 'prefix',
            spacing: 'none',
          }),
        }),
      }),
    );
  });

  it('preserves public ownership when an admin replaces a public definition', async () => {
    const repository = createRepository();
    const service = createUnitDefinitionManagementService(repository);
    const access = { principalId: createEntityId('admin-1'), roles: ['admin'] };
    const current = createUnitDefinition({
      code: createUnitCode('UN/CEFACT:LTR'),
      system: 'si',
      visibility: 'public',
      representation: createUnitRepresentation({
        symbol: 'L',
        asciiFallback: 'L',
        position: 'suffix',
        spacing: 'narrow',
      }),
      catalogueVersion: 'UN/CEFACT-Rev17-aquarium-core',
    });

    await service.save({
      access,
      id: createEntityId('unit-1'),
      expectedRevision: 1,
      current,
      currentLifecycle: 'active',
      draft,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          code: current.code,
          visibility: 'public',
          system: 'si',
        }),
      }),
    );
  });

  it('publishes a private definition as a new public version', async () => {
    const repository = createRepository();
    const service = createUnitDefinitionManagementService(repository);
    const access = { principalId: createEntityId('admin-1'), roles: ['admin'] };
    const current = createUnitDefinition({
      code: createUnitCode('TANKOS:CUSTOM-ALK'),
      ownerId: 'keeper-1',
      visibility: 'private',
      system: 'custom',
      representation: createUnitRepresentation({
        symbol: 'dKH',
        asciiFallback: 'dKH',
        position: 'suffix',
        spacing: 'narrow',
      }),
      catalogueVersion: 'TANKOS-CUSTOM-1',
    });

    await service.publish({
      access,
      id: createEntityId('unit-1'),
      expectedRevision: 1,
      current,
      currentLifecycle: 'active',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          visibility: 'public',
        }),
      }),
    );
    expect(repository.create.mock.calls[0]?.[0]?.input).not.toHaveProperty(
      'ownerId',
    );
  });

  it('rejects publishing a previously marked version', async () => {
    const repository = createRepository();
    const service = createUnitDefinitionManagementService(repository);

    await expect(
      service.publish({
        access: { principalId: createEntityId('admin-1'), roles: ['admin'] },
        id: createEntityId('unit-1'),
        expectedRevision: 1,
        current: createUnitDefinition({
          code: createUnitCode('TANKOS:CUSTOM-ALK'),
          ownerId: 'keeper-1',
          system: 'custom',
          visibility: 'private',
          representation: createUnitRepresentation({
            symbol: 'dKH',
            asciiFallback: 'dKH',
            position: 'suffix',
            spacing: 'narrow',
          }),
          catalogueVersion: 'test',
        }),
        currentLifecycle: 'marked-for-deletion',
      }),
    ).rejects.toMatchObject({ code: 'UNIT_PUBLISH_INVALID_STATE' });
    expect(repository.create).not.toHaveBeenCalled();
  });

  function createRepository(): CrudRepositoryPort<
    UnitDefinition,
    UnitDefinition,
    UnitDefinition,
    UnitDefinitionFilter
  > {
    const record = (data: UnitDefinition) => ({
      id: createEntityId('unit-1'),
      data,
      lifecycle: { status: 'active' as const },
      revision: 1,
      metadata: {
        schemaVersion: 1,
        createdAt: { kind: 'instant' as const, epochMilliseconds: 0 },
        updatedAt: { kind: 'instant' as const, epochMilliseconds: 0 },
      },
    });
    return {
      list: vi.fn(async () => ({ items: [], hasMore: false })),
      get: vi.fn(async () => undefined),
      create: vi.fn(async ({ input }) => record(input)),
      replace: vi.fn(async (_request, input) => record(input)),
      markForDeletion: vi.fn(async () => record(undefined as never)),
      restore: vi.fn(async () => record(undefined as never)),
      delete: vi.fn(async () => undefined),
    };
  }
});
