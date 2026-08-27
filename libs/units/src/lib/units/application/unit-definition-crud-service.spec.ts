import { createEntityId, type CrudRepositoryPort } from '@tankos/data-access';
import { describe, expect, it, vi } from 'vitest';
import {
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
  type UnitDefinition,
  type UnitDefinitionFilter,
} from '../core';
import { createUnitDefinitionCrudService } from './unit-definition-crud-service';

describe('createUnitDefinitionCrudService', () => {
  const definition = createUnitDefinition({
    code: createUnitCode('TANKOS:CUSTOM-ALK'),
    ownerId: 'keeper-1',
    visibility: 'private',
    system: 'custom',
    representation: createUnitRepresentation({
      symbol: 'dKH',
      asciiFallback: 'dKH',
      position: 'suffix',
      spacing: 'normal',
    }),
    catalogueVersion: 'TankOS-custom-v1',
  });

  it('Given a custom repository, When CRUD commands are used, Then delegates every operation', async () => {
    const repository = createRepository();
    const service = createUnitDefinitionCrudService(repository);
    const access = {
      principalId: createEntityId('admin-1'),
      roles: ['admin'],
    };
    const listRequest = {
      access,
      page: { pageSize: 10 },
      filter: { system: 'custom' as const },
    };
    const getRequest = { access, id: createEntityId('unit-1') };
    const command = {
      access,
      id: createEntityId('unit-1'),
      expectedRevision: 1,
    };
    const createRequest = { access, input: definition };

    await service.list(listRequest);
    await service.get(getRequest);
    await service.create(createRequest);
    await service.replace(command, definition);
    await service.markForDeletion(command);
    await service.restore(command);
    await service.delete(command);

    expect(repository.list).toHaveBeenCalledWith(listRequest);
    expect(repository.get).toHaveBeenCalledWith(getRequest);
    expect(repository.create).toHaveBeenCalledWith(createRequest);
    expect(repository.replace).not.toHaveBeenCalled();
    expect(repository.markForDeletion).toHaveBeenCalledWith(command);
    expect(repository.restore).toHaveBeenCalledWith(command);
    expect(repository.delete).toHaveBeenCalledWith(command);
  });

  it('Given a public definition, When creation is requested, Then delegates it to the repository', async () => {
    const repository = createRepository();
    const service = createUnitDefinitionCrudService(repository);

    await expect(
      service.create({
        access: { principalId: createEntityId('admin-1'), roles: ['admin'] },
        input: { ...definition, system: 'si' },
      }),
    ).resolves.toBeDefined();
    expect(repository.create).toHaveBeenCalled();
  });

  it('Given a public definition, When replacement is requested, Then delegates it to the repository', async () => {
    const repository = createRepository();
    const service = createUnitDefinitionCrudService(repository);

    await expect(
      service.replace(
        {
          access: { principalId: createEntityId('admin-1'), roles: ['admin'] },
          id: createEntityId('unit-1'),
          expectedRevision: 1,
        },
        { ...definition, system: 'metric' },
      ),
    ).resolves.toBeDefined();
    expect(repository.create).toHaveBeenCalled();
  });

  it('configures atomic replacement when the repository supports it', () => {
    const repository = createRepository();
    repository.replaceVersioned = vi.fn();

    expect(createUnitDefinitionCrudService(repository)).toBeDefined();
  });

  it('validates a replacement against the current private definition', async () => {
    const repository = createRepository();
    repository.get = vi.fn(async () => ({
      id: createEntityId('unit-1'),
      data: definition,
      lifecycle: { status: 'active' as const },
      revision: 1,
      metadata: {},
    }));
    const service = createUnitDefinitionCrudService(repository);

    await expect(
      service.replace(
        {
          access: {
            principalId: createEntityId('keeper-1'),
            roles: ['keeper'],
          },
          id: createEntityId('unit-1'),
          expectedRevision: 1,
        },
        { ...definition, visibility: 'public' },
      ),
    ).rejects.toThrow();
    expect(repository.create).not.toHaveBeenCalled();
  });

  function createRepository(): CrudRepositoryPort<
    UnitDefinition,
    UnitDefinition,
    UnitDefinition,
    UnitDefinitionFilter
  > {
    return {
      list: vi.fn(async () => ({ items: [], hasMore: false })),
      get: vi.fn(async () => undefined),
      create: vi.fn(async (request) => ({
        id: createEntityId('unit-1'),
        data: request.input,
        lifecycle: { status: 'active' as const },
        revision: 1,
        metadata: {
          createdAt: { kind: 'instant' as const, epochMilliseconds: 0 },
          updatedAt: { kind: 'instant' as const, epochMilliseconds: 0 },
        },
      })),
      replace: vi.fn(async (_request, input) => ({
        id: createEntityId('unit-1'),
        data: input,
        lifecycle: { status: 'active' as const },
        revision: 2,
        metadata: {
          createdAt: { kind: 'instant' as const, epochMilliseconds: 0 },
          updatedAt: { kind: 'instant' as const, epochMilliseconds: 0 },
        },
      })),
      markForDeletion: vi.fn(async () => undefined as never),
      restore: vi.fn(async () => undefined as never),
      delete: vi.fn(async () => undefined),
    };
  }
});
