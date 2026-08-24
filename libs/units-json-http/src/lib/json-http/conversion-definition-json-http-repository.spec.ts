import { createEntityId } from '@tankos/data-access';
import { createJsonHttpTimeAdapter } from '@tankos/time-json-http';
import { createNativeTimeAdapter } from '@tankos/time';
import { createConversionDefinition, createUnitCode } from '@tankos/units';
import { conversionDefinitionToDto } from '@tankos/units-zod';
import { describe, expect, it, vi } from 'vitest';
import { createConversionDefinitionJsonHttpRepository } from './conversion-definition-json-http-repository';

describe('createConversionDefinitionJsonHttpRepository', () => {
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
    provenance: 'test',
  });
  const client = { request: vi.fn() };
  const access = {
    principalId: createEntityId('admin'),
    roles: ['admin'],
    requestId: 'request-1',
  };
  const command = {
    access,
    id: createEntityId('conversion-1'),
    expectedRevision: 1,
  };
  const record = {
    id: 'conversion-1',
    data: conversionDefinitionToDto(definition),
    lifecycle: { status: 'active' as const },
    revision: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: '2026-08-20T15:30:00Z',
      updatedAt: '2026-08-20T15:30:00Z',
    },
  };

  it('Given a conversion domain command, When sent over HTTP, Then maps it through the shared repository', async () => {
    client.request.mockResolvedValue(record);
    const repository = createConversionDefinitionJsonHttpRepository({
      client,
      baseUrl: '/api',
      time: createJsonHttpTimeAdapter(createNativeTimeAdapter()),
      listUrl: () => '/conversion-definitions',
      recordUrl: (id: string) => `/conversion-definitions/${id}`,
    });

    await expect(
      repository.create({
        access: { ...access, requestId: 'request-2' },
        input: definition,
      }),
    ).resolves.toMatchObject({ data: definition });
    await expect(
      repository.replace(command, definition),
    ).resolves.toMatchObject({ data: definition });
    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({ body: conversionDefinitionToDto(definition) }),
    );
  });
});
