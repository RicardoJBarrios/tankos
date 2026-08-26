import type { Firestore } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultUnitDefinitionFirestoreRepository } from './unit-definition-firestore-factory';

const mocks = vi.hoisted(() => ({
  createRepository: vi.fn(),
  orderBy: vi.fn(() => ({ field: 'data.code', direction: 'asc' })),
  query: vi.fn((reference, ordering) => ({ reference, ordering })),
}));

vi.mock('./unit-definition-firestore-repository', () => ({
  createUnitDefinitionFirestoreRepository: mocks.createRepository,
}));
vi.mock('firebase/firestore', () => ({
  orderBy: mocks.orderBy,
  query: mocks.query,
}));

describe('createDefaultUnitDefinitionFirestoreRepository', () => {
  it('creates the canonical units collection query and cursor adapter', () => {
    const repository = { marker: true };
    mocks.createRepository.mockReturnValueOnce(repository);

    const result = createDefaultUnitDefinitionFirestoreRepository({
      firestore: {} as Firestore,
      clock: { now: vi.fn() },
    });
    const options = mocks.createRepository.mock.calls[0]?.[0];

    expect(result).toBe(repository);
    expect(options.collectionPath).toBe('units');
    expect(options.createId({ code: 'TANKOS:CUSTOM dKH' })).toBe(
      'tankos-custom-dkh',
    );
    expect(
      options.createId(
        { code: 'TANKOS:CUSTOM dKH' },
        { requestId: 'units-1:replacement:1' },
      ),
    ).toBe('tankos-custom-dkh-units-1-replacement-1');
    expect(options.buildQuery({})).toEqual({
      reference: {},
      ordering: { field: 'data.code', direction: 'asc' },
    });
    expect(options.encodeCursor({ id: 'unit-1' })).toContain('unit-1');
    expect(options.authorize({ roles: ['keeper'] }, 'mark')).toBeUndefined();
    expect(() => options.authorize({ roles: ['viewer'] }, 'mark')).toThrow(
      'Custom unit catalogue requires keeper access',
    );
  });
});
