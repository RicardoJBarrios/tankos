import { createEntityId } from '@tankos/data-access';
import {
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
} from '@tankos/units';
import { unitDefinitionToDto } from '@tankos/units-zod';
import { Timestamp } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import {
  createUnitDefinitionFirestoreRepository,
  unitDefinitionRecordSchema,
} from './unit-definition-firestore-repository';

const firestoreAdapter = vi.hoisted(() => ({
  createFirestoreCrudRepository: vi.fn(),
}));

vi.mock('@tankos/data-access-firestore', async (importOriginal) => ({
  ...(await importOriginal()),
  createFirestoreCrudRepository: firestoreAdapter.createFirestoreCrudRepository,
}));

describe('createUnitDefinitionFirestoreRepository', () => {
  const definition = createUnitDefinition({
    code: createUnitCode('UN/CEFACT:LTR'),
    visibility: 'public',
    system: 'metric',
    representation: createUnitRepresentation({
      symbol: 'L',
      asciiFallback: 'L',
      position: 'suffix',
      spacing: 'normal',
    }),
    catalogueVersion: 'test',
  });
  const record = {
    id: createEntityId('unit-1'),
    data: { ...unitDefinitionToDto(definition), storageId: 'unit-1' },
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
    const repository = createUnitDefinitionFirestoreRepository({
      firestore: {} as never,
      collectionPath: 'units',
      createId: () => 'unit-1',
      buildQuery: () => ({}) as never,
      encodeCursor: () => 'cursor' as never,
    });
    const access = { principalId: createEntityId('admin'), roles: ['admin'] };
    const command = {
      access,
      id: createEntityId('unit-1'),
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
        collectionPath: 'units',
        createData: expect.any(Function),
        updateData: expect.any(Function),
      }),
    );
    const firestoreOptions =
      firestoreAdapter.createFirestoreCrudRepository.mock.calls[0][0];
    expect(firestoreOptions.createData(definition)).toEqual(
      unitDefinitionToDto(definition),
    );
    expect(firestoreOptions.updateData(record.data, definition)).toEqual(
      expect.objectContaining(unitDefinitionToDto(definition)),
    );
    expect(raw.create).toHaveBeenCalledWith({ access, input: definition });
  });

  it('Given a valid Firestore envelope, When parsed, Then accepts the canonical unit DTO', () => {
    const envelope = Object.fromEntries(
      Object.entries(record).filter(([key]) => key !== 'id'),
    );

    expect(unitDefinitionRecordSchema.parse(envelope).data).toEqual(
      expect.objectContaining(unitDefinitionToDto(definition)),
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
