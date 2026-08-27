import type { Firestore } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultUnitDefinitionFirestoreRepository } from './unit-definition-firestore-factory';

const mocks = vi.hoisted(() => ({
  createRepository: vi.fn(),
  orderBy: vi.fn(() => ({ field: 'data.code', direction: 'asc' })),
  where: vi.fn((field, operator, value) => ({ field, operator, value })),
  and: vi.fn((...filters) => ({ and: filters })),
  or: vi.fn((...filters) => ({ or: filters })),
  query: vi.fn((reference, ...constraints) => ({ reference, constraints })),
}));

vi.mock('./unit-definition-firestore-repository', () => ({
  createUnitDefinitionFirestoreRepository: mocks.createRepository,
}));
vi.mock('firebase/firestore', () => ({
  orderBy: mocks.orderBy,
  where: mocks.where,
  and: mocks.and,
  or: mocks.or,
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
    expect(
      options.buildQuery(
        {},
        {
          access: { principalId: 'keeper-1', roles: ['keeper'] },
        },
      ),
    ).toEqual({
      reference: {},
      constraints: [
        {
          or: [
            {
              and: [
                { field: 'data.visibility', operator: '==', value: 'public' },
                {
                  field: 'lifecycle.status',
                  operator: 'in',
                  value: ['active', 'inactive'],
                },
              ],
            },
            {
              and: [
                { field: 'data.visibility', operator: '==', value: 'private' },
                { field: 'data.ownerId', operator: '==', value: 'keeper-1' },
                {
                  field: 'lifecycle.status',
                  operator: 'in',
                  value: ['active', 'inactive'],
                },
              ],
            },
          ],
        },
        { field: 'data.code', direction: 'asc' },
      ],
    });
    options.buildQuery(
      {},
      {
        access: { principalId: 'keeper-1', roles: ['keeper'] },
        filter: { record: 'BAR' },
      },
    );
    expect(
      options.buildQuery(
        {},
        {
          access: { principalId: 'admin-1', roles: ['admin'] },
          filter: {
            ownerId: 'keeper-1',
            ownerName: 'Keeper One',
            record: 'TANKOS:CUSTOM',
          },
        },
      ),
    ).toEqual({
      reference: {},
      constraints: [
        { field: 'data.ownerId', operator: '==', value: 'keeper-1' },
        {
          field: 'data.ownerSearchTokens',
          operator: 'array-contains',
          value: 'keeper one',
        },
        {
          field: 'lifecycle.status',
          operator: 'in',
          value: ['active', 'inactive'],
        },
        {
          field: 'data.codeSearchTokens',
          operator: 'array-contains',
          value: 'tankos:custom',
        },
        { field: 'data.code', direction: 'asc' },
      ],
    });
    expect(
      options.buildQuery(
        {},
        {
          access: { principalId: 'admin-1', roles: ['admin'] },
          filter: { visibility: 'public' },
        },
      ),
    ).toEqual({
      reference: {},
      constraints: [
        { field: 'data.visibility', operator: '==', value: 'public' },
        {
          field: 'lifecycle.status',
          operator: 'in',
          value: ['active', 'inactive'],
        },
        { field: 'data.code', direction: 'asc' },
      ],
    });
    expect(
      options.buildQuery(
        {},
        {
          access: { principalId: 'keeper-1', roles: ['keeper'] },
          filter: { visibility: 'public' },
        },
      ),
    ).toEqual({
      reference: {},
      constraints: [
        { field: 'data.visibility', operator: '==', value: 'public' },
        {
          field: 'lifecycle.status',
          operator: 'in',
          value: ['active', 'inactive'],
        },
        { field: 'data.code', direction: 'asc' },
      ],
    });
    expect(
      options.buildQuery(
        {},
        {
          access: { principalId: 'keeper-1', roles: ['keeper'] },
          filter: { visibility: 'private' },
        },
      ),
    ).toEqual({
      reference: {},
      constraints: [
        { field: 'data.visibility', operator: '==', value: 'private' },
        { field: 'data.ownerId', operator: '==', value: 'keeper-1' },
        {
          field: 'lifecycle.status',
          operator: 'in',
          value: ['active', 'inactive'],
        },
        { field: 'data.code', direction: 'asc' },
      ],
    });
    expect(
      options.buildQuery(
        {},
        {
          access: { principalId: 'admin-1', roles: ['admin'] },
        },
      ),
    ).toEqual({
      reference: {},
      constraints: [
        {
          field: 'lifecycle.status',
          operator: 'in',
          value: ['active', 'inactive'],
        },
        { field: 'data.code', direction: 'asc' },
      ],
    });
    expect(options.encodeCursor({ id: 'unit-1' })).toContain('unit-1');
    expect(options.authorize({ roles: ['keeper'] }, 'mark')).toBeUndefined();
    expect(options.authorize({ roles: ['admin'] }, 'mark')).toBeUndefined();
    expect(() => options.authorize({ roles: ['viewer'] }, 'mark')).toThrow(
      'Unit catalogue requires keeper or admin access',
    );
    expect(() =>
      options.authorize({ roles: ['keeper'] }, 'list', ['marked-for-deletion']),
    ).toThrow('Deleted unit records require admin access');
  });
});
