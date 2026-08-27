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

  it('validates a replacement against the current record before creating it', async () => {
    const validateReplace = vi.fn();
    const service = createVersionedCrudService(
      createServiceWithCurrentRecord(),
      { toCreateInput: (input) => input, validateReplace },
    );

    await service.replace(
      {
        access: { principalId: createEntityId('admin-1'), roles: ['admin'] },
        id: createEntityId('old-unit'),
        expectedRevision: 1,
      },
      { value: 'new' },
    );

    expect(validateReplace).toHaveBeenCalledOnce();
  });

  it('does not validate when the replacement target no longer exists', async () => {
    const validateReplace = vi.fn();
    const service = createVersionedCrudService(createService([]), {
      toCreateInput: (input) => input,
      validateReplace,
    });
    await service.replace(
      {
        access: { principalId: createEntityId('admin-1'), roles: ['admin'] },
        id: createEntityId('missing-unit'),
        expectedRevision: 1,
      },
      { value: 'new' },
    );
    expect(validateReplace).not.toHaveBeenCalled();
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

  it('uses the provider atomic replacement when available', async () => {
    const atomic = vi.fn(async () => ({
      id: createEntityId('new-unit'),
      data: { value: 'new' },
      lifecycle: { status: 'active' as const },
      revision: 1,
      metadata: {},
    }));
    const service = createVersionedCrudService(createService([]), {
      toCreateInput: (input) => input,
      replaceAtomically: atomic,
    });
    const request = {
      access: { principalId: createEntityId('keeper-1'), roles: ['keeper'] },
      id: createEntityId('old-unit'),
      expectedRevision: 1,
    };
    await expect(
      service.replace(request, { value: 'new' }),
    ).resolves.toMatchObject({
      data: { value: 'new' },
    });
    expect(atomic).toHaveBeenCalledWith(request, { value: 'new' });
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

  function createServiceWithCurrentRecord() {
    const service = createService([]);
    service.get = vi.fn(async () => ({
      id: createEntityId('old-unit'),
      data: { value: 'old' },
      lifecycle: { status: 'active' as const },
      revision: 1,
      metadata: {
        createdAt: { kind: 'instant' as const, epochMilliseconds: 0 },
        updatedAt: { kind: 'instant' as const, epochMilliseconds: 0 },
      },
    }));
    return service;
  }
});
