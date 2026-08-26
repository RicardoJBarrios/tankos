import { createEntityId, type CrudRepositoryPort } from '@tankos/data-access';
import { describe, expect, it, vi } from 'vitest';
import type { UnitDefinition, UnitDefinitionFilter } from '../core';
import {
  createUnitDefinitionManagementService,
  type CustomUnitDefinitionDraft,
} from './unit-definition-management-service';

const draft: CustomUnitDefinitionDraft = {
  code: 'TANKOS:CUSTOM-ALK',
  symbol: 'dKH',
  asciiFallback: 'dKH',
  quantityKind: 'alkalinity',
  conversionFamily: 'alkalinity',
};

describe('createUnitDefinitionManagementService', () => {
  it('creates a validated custom definition from application input', async () => {
    const repository = createRepository();
    const service = createUnitDefinitionManagementService(repository);
    const access = { principalId: createEntityId('admin-1'), roles: ['admin'] };

    const result = await service.save({ access, draft });

    expect(result.data).toMatchObject({
      code: 'TANKOS:CUSTOM-ALK',
      system: 'custom',
      ownerId: access.principalId,
      visibility: 'private',
      quantityKind: 'alkalinity',
      conversionFamily: 'alkalinity',
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
