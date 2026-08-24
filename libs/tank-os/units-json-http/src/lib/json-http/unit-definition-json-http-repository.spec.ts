import { createEntityId } from '@tank-os/data-access';
import { createJsonHttpTimeAdapter } from '@tank-os/time-json-http';
import { createNativeTimeAdapter } from '@tank-os/time';
import {
  createStandardUnitCatalogue,
  type UnitDefinition,
} from '@tank-os/units';
import { unitDefinitionToDto } from '@tank-os/units-zod';
import { describe, expect, it, vi } from 'vitest';
import { createUnitDefinitionJsonHttpRepository } from './unit-definition-json-http-repository';

describe('createUnitDefinitionJsonHttpRepository', () => {
  const definition = createStandardUnitCatalogue().find(
    'UN/CEFACT:LTR' as never,
  ) as UnitDefinition;
  const client = { request: vi.fn() };
  const options = {
    client,
    baseUrl: '/api',
    time: createJsonHttpTimeAdapter(createNativeTimeAdapter()),
    listUrl: () => '/units',
    recordUrl: (id: string) => `/units/${id}`,
  };
  const access = {
    principalId: createEntityId('admin'),
    roles: ['admin'],
    requestId: 'request-1',
  };
  const command = {
    access,
    id: createEntityId('unit-1'),
    expectedRevision: 1,
  };
  const record = {
    id: 'unit-1',
    data: unitDefinitionToDto(definition),
    lifecycle: { status: 'active' as const },
    revision: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: '2026-08-20T15:30:00Z',
      updatedAt: '2026-08-20T15:30:00Z',
    },
  };

  it('Given domain CRUD calls, When sent over HTTP, Then uses the shared repository and maps DTOs', async () => {
    client.request
      .mockResolvedValueOnce({ items: [record], hasMore: false })
      .mockResolvedValue(record);
    const repository = createUnitDefinitionJsonHttpRepository(options);

    await expect(
      repository.list({
        access,
        page: { pageSize: 10, orderBy: [{ field: 'id', direction: 'asc' }] },
      }),
    ).resolves.toMatchObject({ items: [{ data: definition }] });
    await expect(
      repository.get({ access, id: command.id }),
    ).resolves.toMatchObject({ data: definition });
    await expect(
      repository.create({
        access: { ...access, requestId: 'request-2' },
        input: definition,
      }),
    ).resolves.toMatchObject({ data: definition });
    await expect(
      repository.replace(command, definition),
    ).resolves.toMatchObject({ data: definition });
    await expect(repository.markForDeletion(command)).resolves.toMatchObject({
      data: definition,
    });
    await expect(repository.restore(command)).resolves.toMatchObject({
      data: definition,
    });
    await repository.delete(command);

    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST' }),
    );
    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({ body: unitDefinitionToDto(definition) }),
    );
  });
});
