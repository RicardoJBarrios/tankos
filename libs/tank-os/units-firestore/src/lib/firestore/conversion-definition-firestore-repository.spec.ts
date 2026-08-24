import { createEntityId } from '@tank-os/data-access';
import { createConversionDefinition, createUnitCode } from '@tank-os/units';
import { conversionDefinitionToDto } from '@tank-os/units-zod';
import { Timestamp } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import {
  conversionDefinitionRecordSchema,
  createConversionDefinitionFirestoreRepository,
} from './conversion-definition-firestore-repository';

const firestoreAdapter = vi.hoisted(() => ({
  createFirestoreCrudRepository: vi.fn(),
}));

vi.mock('@tank-os/data-access-firestore', async (importOriginal) => ({
  ...(await importOriginal()),
  createFirestoreCrudRepository: firestoreAdapter.createFirestoreCrudRepository,
}));

describe('createConversionDefinitionFirestoreRepository', () => {
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
  const record = {
    id: createEntityId('conversion-1'),
    data: conversionDefinitionToDto(definition),
    lifecycle: { status: 'active' as const },
    revision: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: Timestamp.fromMillis(0),
      updatedAt: Timestamp.fromMillis(0),
    },
  };

  it('Given a domain CRUD call, When persisted, Then maps domain data to Firestore and back', async () => {
    const raw = createRawRepository();
    firestoreAdapter.createFirestoreCrudRepository.mockReturnValue(raw);
    const repository = createConversionDefinitionFirestoreRepository({
      firestore: {} as never,
      collectionPath: 'conversion-definitions',
      createId: () => 'conversion-1',
      buildQuery: () => ({}) as never,
      encodeCursor: () => 'cursor' as never,
    });
    const access = { principalId: createEntityId('admin'), roles: ['admin'] };
    const command = {
      access,
      id: createEntityId('conversion-1'),
      expectedRevision: 1,
    };

    await expect(
      repository.list({ access, page: { pageSize: 10 } as never }),
    ).resolves.toMatchObject({ items: [{ data: definition }] });
    await expect(
      repository.get({ access, id: command.id }),
    ).resolves.toMatchObject({ data: definition });
    await expect(
      repository.create({ access, input: definition }),
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
    raw.get.mockResolvedValueOnce(undefined);
    await expect(
      repository.get({ access, id: command.id }),
    ).resolves.toBeUndefined();

    expect(firestoreAdapter.createFirestoreCrudRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionPath: 'conversion-definitions',
        createData: expect.any(Function),
        updateData: expect.any(Function),
      }),
    );
    const firestoreOptions =
      firestoreAdapter.createFirestoreCrudRepository.mock.calls[0][0];
    expect(firestoreOptions.createData(definition)).toEqual(
      conversionDefinitionToDto(definition),
    );
    expect(firestoreOptions.updateData(record.data, definition)).toEqual(
      conversionDefinitionToDto(definition),
    );
  });

  it('Given a valid Firestore envelope, When parsed, Then accepts the canonical conversion DTO', () => {
    const envelope = Object.fromEntries(
      Object.entries(record).filter(([key]) => key !== 'id'),
    );

    expect(conversionDefinitionRecordSchema.parse(envelope).data).toEqual(
      conversionDefinitionToDto(definition),
    );
  });

  function createRawRepository() {
    return {
      list: vi.fn(async () => ({ items: [record], hasMore: false })),
      get: vi.fn(async () => record),
      create: vi.fn(async () => record),
      replace: vi.fn(async () => record),
      markForDeletion: vi.fn(async () => record),
      restore: vi.fn(async () => record),
      delete: vi.fn(async () => undefined),
    };
  }
});
