import { describe, expect, it, vi } from 'vitest';
import { createMappedFirestoreCrudRepository } from './mapped-firestore-crud-repository';

describe('createMappedFirestoreCrudRepository', () => {
  it('Given a DTO repository, When CRUD operations return records, Then domain data is parsed while metadata is preserved', async () => {
    const source = {
      list: vi.fn().mockResolvedValue({
        items: [{ data: '1', revision: 1 }],
        nextCursor: undefined,
      }),
      get: vi.fn().mockResolvedValue({ data: '2', revision: 2 }),
      create: vi.fn().mockResolvedValue({ data: '3', revision: 3 }),
      replace: vi.fn().mockResolvedValue({ data: '4', revision: 4 }),
      replaceVersioned: vi.fn().mockResolvedValue({ data: '4', revision: 4 }),
      markForDeletion: vi.fn().mockResolvedValue({ data: '5', revision: 5 }),
      restore: vi.fn().mockResolvedValue({ data: '6', revision: 6 }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const repository = createMappedFirestoreCrudRepository(source, Number);

    await expect(repository.list({} as never)).resolves.toEqual({
      items: [expect.objectContaining({ data: 1, revision: 1 })],
      nextCursor: undefined,
    });
    await expect(repository.get({ id: 'id' } as never)).resolves.toEqual(
      expect.objectContaining({ data: 2 }),
    );
    await expect(repository.create({ input: '3' } as never)).resolves.toEqual(
      expect.objectContaining({ data: 3 }),
    );
    await expect(
      repository.replace({ id: 'id' } as never, '4'),
    ).resolves.toEqual(expect.objectContaining({ data: 4 }));
    await expect(
      repository.replaceVersioned?.({ id: 'id' } as never, '4'),
    ).resolves.toEqual(expect.objectContaining({ data: 4 }));
    await expect(
      repository.markForDeletion({ id: 'id' } as never),
    ).resolves.toEqual(expect.objectContaining({ data: 5 }));
    await expect(repository.restore({ id: 'id' } as never)).resolves.toEqual(
      expect.objectContaining({ data: 6 }),
    );
    await expect(
      repository.delete({ id: 'id' } as never),
    ).resolves.toBeUndefined();
  });

  it('Given a DTO repository, When get returns no record, Then the mapped repository preserves undefined', async () => {
    const source = {
      list: vi.fn(),
      get: vi.fn().mockResolvedValue(undefined),
      create: vi.fn(),
      replace: vi.fn(),
      markForDeletion: vi.fn(),
      restore: vi.fn(),
      delete: vi.fn(),
    };
    const repository = createMappedFirestoreCrudRepository(source, Number);

    await expect(
      repository.get({ id: 'missing' } as never),
    ).resolves.toBeUndefined();
  });
});
