import { createPageCursor } from './page-cursor';
import { createPageRequest } from './pagination';

describe('pagination contracts', () => {
  it('Given an opaque provider cursor, When created, Then preserves it without interpreting its contents', () => {
    expect(createPageCursor('firestore:encoded-cursor')).toBe(
      'firestore:encoded-cursor',
    );
  });

  it.each(['', ' ', '\t'])(
    'Given blank cursor %j, When created, Then rejects it',
    (value) => {
      expect(() => createPageCursor(value)).toThrow(TypeError);
    },
  );

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

  it('Given no ordering fields, When validated, Then rejects the request', () => {
    expect(() => createPageRequest({ pageSize: 20, orderBy: [] })).toThrow(
      TypeError,
    );
  });

  it('Given a blank ordering field, When validated, Then rejects the request', () => {
    expect(() =>
      createPageRequest({
        pageSize: 20,
        orderBy: [{ field: '  ', direction: 'asc' }],
      }),
    ).toThrow(TypeError);
  });
});
