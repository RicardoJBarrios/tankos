import { describe, expect, it, vi } from 'vitest';
import { createEntityId } from '../core';
import { createVersionedCrudService } from './versioned-crud-service';
import type { CrudService } from './crud-service';

describe('createVersionedCrudService', () => {
  it('Given a current record, When it is replaced, Then creates the new record before marking the old one', async () => {
    const calls: string[] = [];
    const service = createVersionedCrudService(createService(calls), {
      toCreateInput: (input) => input,
    });
    const access = {
      principalId: createEntityId('keeper-1'),
      roles: ['admin'],
    };
    const request = {
      access,
      id: createEntityId('old-unit'),
      expectedRevision: 4,
    };

    await expect(
      service.replace(request, { value: 'new' }),
    ).resolves.toMatchObject({
      data: { value: 'new' },
    });
    expect(calls).toEqual(['create', 'mark-for-deletion']);
  });

  it('Given a failed retirement, When a replacement is requested, Then preserves the created record and exposes the retirement failure', async () => {
    const calls: string[] = [];
    const service = createVersionedCrudService(
      createService(calls, new Error('retirement-failed')),
      { toCreateInput: (input) => input },
    );
    const request = {
      access: { principalId: createEntityId('keeper-1'), roles: ['admin'] },
      id: createEntityId('old-unit'),
      expectedRevision: 4,
    };

    await expect(service.replace(request, { value: 'new' })).rejects.toThrow(
      'retirement-failed',
    );
    expect(calls).toEqual(['create', 'mark-for-deletion']);
  });

  function createService(
    calls: string[],
    retirementFailure?: Error,
  ): Omit<
    CrudService<{ value: string }, { value: string }, { value: string }>,
    'replace'
  > {
    return {
      list: vi.fn(async () => ({ items: [], hasMore: false })),
      get: vi.fn(async () => undefined),
      create: vi.fn(async (request) => {
        calls.push('create');
        return {
          id: createEntityId('new-unit'),
          data: request.input,
          lifecycle: { status: 'active' as const },
          revision: 1,
          metadata: {
            createdAt: { kind: 'instant' as const, epochMilliseconds: 0 },
            updatedAt: { kind: 'instant' as const, epochMilliseconds: 0 },
          },
        };
      }),
      markForDeletion: vi.fn(async () => {
        calls.push('mark-for-deletion');
        if (retirementFailure) throw retirementFailure;
        return undefined as never;
      }),
      restore: vi.fn(async () => undefined as never),
      delete: vi.fn(async () => undefined),
    };
  }
});
