import { createEntityId, type CrudRepositoryPort } from '@tankos/data-access';
import { describe, expect, it, vi } from 'vitest';
import {
  createConversionDefinition,
  createUnitCode,
  type ConversionDefinition,
  type ConversionDefinitionFilter,
} from '../core';
import { createStandardUnitCatalogue } from '../adapters/standard';
import { createConversionDefinitionCrudService } from './conversion-definition-crud-service';

describe('createConversionDefinitionCrudService', () => {
  const definition = createConversionDefinition({
    code: 'TANKOS:CUSTOM-LTR-MLT',
    version: '1',
    origin: 'custom',
    sourceUnit: createUnitCode('UN/CEFACT:LTR'),
    targetUnit: createUnitCode('UN/CEFACT:MLT'),
    family: 'volume',
    kind: 'linear',
    factor: { numerator: '1000', denominator: '1' },
    offset: '0',
    provenance: 'TankOS-custom-v1',
  });

  it('Given a custom repository, When CRUD commands are used, Then delegates every operation', async () => {
    const repository = createRepository();
    const service = createConversionDefinitionCrudService(repository, {
      catalogue: createStandardUnitCatalogue(),
    });
    const access = { principalId: createEntityId('admin-1'), roles: ['admin'] };
    const listRequest = {
      access,
      page: { pageSize: 10 },
      filter: { family: 'volume' },
    };
    const getRequest = { access, id: createEntityId('conversion-1') };
    const command = {
      access,
      id: createEntityId('conversion-1'),
      expectedRevision: 1,
    };

    await service.list(listRequest);
    await service.get(getRequest);
    await service.create({ access, input: definition });
    await service.replace(command, definition);
    await service.markForDeletion(command);
    await service.restore(command);
    await service.delete(command);

    expect(repository.list).toHaveBeenCalledWith(listRequest);
    expect(repository.get).toHaveBeenCalledWith(getRequest);
    expect(repository.create).toHaveBeenCalledWith({
      access,
      input: definition,
    });
    expect(repository.replace).not.toHaveBeenCalled();
    expect(repository.markForDeletion).toHaveBeenCalledWith(command);
    expect(repository.restore).toHaveBeenCalledWith(command);
    expect(repository.delete).toHaveBeenCalledWith(command);
  });

  it('Given a standard definition, When creation is requested, Then rejects it before reaching the repository', async () => {
    const repository = createRepository();
    const service = createConversionDefinitionCrudService(repository, {
      catalogue: createStandardUnitCatalogue(),
    });

    await expect(
      service.create({
        access: { principalId: createEntityId('admin-1'), roles: ['admin'] },
        input: { ...definition, origin: 'standard' },
      }),
    ).rejects.toMatchObject({ code: 'CONVERSION_CUSTOM_REQUIRED' });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('Given a standard definition, When replacement is requested, Then rejects it before reaching the repository', async () => {
    const repository = createRepository();
    const service = createConversionDefinitionCrudService(repository, {
      catalogue: createStandardUnitCatalogue(),
    });

    await expect(
      service.replace(
        {
          access: { principalId: createEntityId('admin-1'), roles: ['admin'] },
          id: createEntityId('conversion-1'),
          expectedRevision: 1,
        },
        { ...definition, origin: 'standard' },
      ),
    ).rejects.toMatchObject({ code: 'CONVERSION_CUSTOM_REQUIRED' });
    expect(repository.create).not.toHaveBeenCalled();
  });

  function createRepository(): CrudRepositoryPort<
    ConversionDefinition,
    ConversionDefinition,
    ConversionDefinition,
    ConversionDefinitionFilter
  > {
    return {
      list: vi.fn(async () => ({ items: [], hasMore: false })),
      get: vi.fn(async () => undefined),
      create: vi.fn(async (request) => ({
        id: createEntityId('conversion-1'),
        data: request.input,
        lifecycle: { status: 'active' as const },
        revision: 1,
        metadata: {
          createdAt: { kind: 'instant' as const, epochMilliseconds: 0 },
          updatedAt: { kind: 'instant' as const, epochMilliseconds: 0 },
        },
      })),
      replace: vi.fn(),
      markForDeletion: vi.fn(async () => undefined as never),
      restore: vi.fn(async () => undefined as never),
      delete: vi.fn(async () => undefined),
    };
  }
});
