import { DataAccessError, createEntityId } from '@tankos/data-access';
import { describe, expect, it } from 'vitest';
import {
  createFirestoreAdminBatchStoreContext,
  fromDto,
  mapError,
  toTechnicalTimestamp,
  toDto,
  toTimestamp,
  updatedLeaseFields,
  validateClaimRequest,
} from './firestore-admin-batch-store-context';
import type { BatchDto } from './firestore-admin-batch-store-context';

const instant = toTimestamp({ kind: 'instant', epochMilliseconds: 0 });
const dto: BatchDto = {
  batchId: 'batch-1',
  principalId: 'keeper-1',
  schema: 'units',
  operation: 'update',
  status: 'queued',
  total: 1,
  processed: 0,
  warnings: 0,
  failures: 0,
  retryCount: 0,
  createdAt: instant,
  updatedAt: instant,
  selection: { fingerprint: 'fingerprint', total: 1, chunkCount: 1 },
  requestFingerprint: 'request',
  leaseOwner: 'worker-1',
  leaseToken: 'token-1',
};

describe('firestore-admin-batch-store-context', () => {
  it('Given a technical instant, When converted to Firestore, Then preserves milliseconds', () => {
    expect(
      toTimestamp({ kind: 'instant', epochMilliseconds: 1234 }).toMillis(),
    ).toBe(1234);
  });

  it('Given a Firestore timestamp, When converted to a technical instant, Then preserves milliseconds', () => {
    expect(
      toTechnicalTimestamp(
        toTimestamp({ kind: 'instant', epochMilliseconds: 5678 }),
      ),
    ).toEqual({
      kind: 'instant',
      epochMilliseconds: 5678,
    });
  });

  it('Given a valid Firestore DTO, When mapped to the domain, Then maps timestamps and optional leases', () => {
    const result = fromDto<{ name: string }>({
      ...dto,
      payload: { name: 'unit' },
      leaseUntil: toTimestamp({ kind: 'instant', epochMilliseconds: 100 }),
    });

    expect(result).toMatchObject({
      batchId: 'batch-1',
      payload: { name: 'unit' },
      leaseUntil: { epochMilliseconds: 100 },
    });
  });

  it('Given a domain batch record, When mapped to Firestore, Then preserves its document fields', () => {
    const result = toDto(fromDto(dto));
    expect(result).toMatchObject({
      batchId: dto.batchId,
      createdAt: instant,
      leaseToken: dto.leaseToken,
    });
  });

  it.each([
    ['permission-denied', 'forbidden'],
    ['not-found', 'not-found'],
    ['already-exists', 'conflict'],
    ['invalid-argument', 'validation'],
    ['unknown', 'transient'],
  ])(
    'Given a Firestore error code %s, When mapped, Then returns %s',
    (code, expected) => {
      expect(() => mapError({ code }, 'operation failed')).toThrow(
        expect.objectContaining({ code: expected }),
      );
    },
  );

  it('Given an existing data access error, When mapped, Then preserves the original error', () => {
    const error = new DataAccessError('conflict', 'already handled');
    expect(() => mapError(error, 'ignored')).toThrow(error);
  });

  it.each([
    { ownerId: '', leaseDurationMilliseconds: 1 },
    { ownerId: 'worker', leaseDurationMilliseconds: 0 },
    { ownerId: 'worker', leaseDurationMilliseconds: 1.5 },
  ])(
    'Given an invalid lease request, When validated, Then rejects it',
    (request) => {
      expect(() => validateClaimRequest(request as never, 'worker')).toThrow(
        'invalid',
      );
    },
  );

  it('Given a valid lease request, When validated, Then accepts it', () => {
    expect(() =>
      validateClaimRequest(
        { ownerId: 'worker', leaseDurationMilliseconds: 100 },
        'materializer',
      ),
    ).not.toThrow();
  });

  it('Given lease fields, When updated, Then normalizes timestamps and clears revoked tokens', () => {
    const result = updatedLeaseFields(dto, {
      updatedAt: { kind: 'instant', epochMilliseconds: 200 },
      leaseUntil: null,
      materializationLeaseUntil: null,
    } as never);
    expect(result).toEqual({
      leaseUntil: undefined,
      leaseToken: undefined,
      materializationLeaseToken: undefined,
    });
  });

  it('Given an Admin Firestore instance, When context is created, Then exposes references and the clock', () => {
    const reference = (path: string) => ({
      path,
      collection: (name: string) => reference(`${path}/${name}`),
      doc: (id: string) => reference(`${path}/${id}`),
    });
    const firestore = {
      collection: (path: string) => reference(path),
    } as never;
    const context = createFirestoreAdminBatchStoreContext(
      firestore,
      'batches',
      { now: () => ({ kind: 'instant', epochMilliseconds: 42 }) },
    );
    expect(context.timestampNow().toMillis()).toBe(42);
    expect(context.batchReference(createEntityId('batch-1'))).toMatchObject({
      path: 'batches/batch-1',
    });
  });
});
