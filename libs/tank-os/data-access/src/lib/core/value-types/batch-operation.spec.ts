import { createEntityId } from './entity-id';
import { createBatchRequest } from './batch-operation';

describe('createBatchRequest', () => {
  const valid = {
    access: {
      principalId: createEntityId('keeper'),
      roles: ['keeper'] as const,
    },
    schema: 'units',
    operation: 'update' as const,
    selection: { kind: 'ids' as const, ids: [createEntityId('one')] },
    confirmationToken: 'confirmed',
    idempotencyKey: 'test-request',
  };

  it('Given a confirmed id selection, When validated, Then returns a normalized request', () => {
    expect(createBatchRequest(valid)).toEqual(valid);
  });

  it('Given a confirmed filter selection, When validated, Then accepts the logical filter', () => {
    const request = {
      ...valid,
      selection: { kind: 'filter' as const, filter: { active: true } },
    };
    expect(createBatchRequest(request)).toEqual(request);
  });

  it.each([
    { ...valid, schema: '' },
    { ...valid, schema: '   ' },
    { ...valid, confirmationToken: '' },
    { ...valid, confirmationToken: '   ' },
  ])(
    'Given missing confirmation metadata, When validated, Then rejects it',
    (request) => {
      expect(() => createBatchRequest(request)).toThrow(TypeError);
    },
  );

  it('Given an empty target list, When validated, Then rejects the batch', () => {
    expect(() =>
      createBatchRequest({
        ...valid,
        selection: { kind: 'ids', ids: [] },
      }),
    ).toThrow(RangeError);
  });

  it('Given duplicate target ids, When validated, Then rejects the batch', () => {
    const id = createEntityId('one');
    expect(() =>
      createBatchRequest({
        ...valid,
        selection: { kind: 'ids', ids: [id, id] },
      }),
    ).toThrow(RangeError);
  });
});
