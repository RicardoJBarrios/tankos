import { createPageCursor } from './page-cursor';

describe('createPageCursor', () => {
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

});
