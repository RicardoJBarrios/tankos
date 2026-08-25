import { createQuantityKind } from './quantity-kind';

describe('createQuantityKind', () => {
  it('Given a semantic category, When created, Then preserves the category', () => {
    expect(createQuantityKind('volume')).toBe('volume');
  });

  it.each(['', ' ', ' volume', 'volume ', '\tvolume'])(
    'Given an invalid category %s, When created, Then throws',
    (value) => {
      expect(() => createQuantityKind(value)).toThrow(TypeError);
    },
  );

  it.each([null, undefined, 42, Number.NaN])(
    'Given a non-string category %s, When created, Then throws a type error',
    (value) => {
      expect(() => createQuantityKind(value as never)).toThrow(TypeError);
    },
  );
});
