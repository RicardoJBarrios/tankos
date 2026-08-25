import { describe, expect, it } from 'vitest';
import { createPageRequest } from './pagination';

describe('createPageRequest', () => {
  it('Given a bounded ordered page, When validated, Then returns the same request', () => {
    const request = {
      pageSize: 50,
      orderBy: [{ field: 'updatedAt', direction: 'desc' as const }],
    };
    expect(createPageRequest(request)).toBe(request);
  });

  it.each([0, -1, 501, 1.5, NaN, Infinity, -Infinity])(
    'Given invalid page size %j, When validated, Then rejects it',
    (pageSize) => {
      expect(() =>
        createPageRequest({
          pageSize,
          orderBy: [{ field: 'id', direction: 'asc' }],
        }),
      ).toThrow(RangeError);
    },
  );

  it.each([undefined, null, '', 1])(
    'Given an invalid request %j, When validated, Then rejects it',
    (request) => {
      expect(() => createPageRequest(request as never)).toThrow(TypeError);
    },
  );

  it('Given a non-numeric page size, When validated, Then rejects it as a range error', () => {
    expect(() =>
      createPageRequest({
        pageSize: '20',
        orderBy: [{ field: 'id', direction: 'asc' }],
      }),
    ).toThrow(RangeError);
  });

  it('Given no ordering fields, When validated, Then rejects the request', () => {
    expect(() => createPageRequest({ pageSize: 20, orderBy: [] })).toThrow(
      TypeError,
    );
  });

  it.each([
    undefined,
    null,
    'not-an-array',
    [],
  ])('Given invalid ordering %j, When validated, Then rejects the request', (orderBy) => {
    expect(() =>
        createPageRequest({ pageSize: 20, orderBy }),
    ).toThrow(TypeError);
  });

  it.each([
    { field: '  ', direction: 'asc' },
    { field: '', direction: 'asc' },
    { field: 'id', direction: 'invalid' },
    { field: null, direction: 'asc' },
    null,
  ])('Given an invalid ordering field %j, When validated, Then rejects it', (item) => {
    expect(() =>
        createPageRequest({ pageSize: 20, orderBy: [item] }),
    ).toThrow(TypeError);
  });

  it('Given duplicate ordering fields, When validated, Then rejects the request', () => {
    expect(() =>
      createPageRequest({
        pageSize: 20,
        orderBy: [
          { field: 'updatedAt', direction: 'desc' },
          { field: 'updatedAt', direction: 'asc' },
        ],
      }),
    ).toThrow(TypeError);
  });
});
