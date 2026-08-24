import { createEntityId } from './entity-id';

describe('createEntityId', () => {
  it('Given a non-empty identifier, When created, Then returns the identifier unchanged', () => {
    expect(createEntityId('unit-1')).toBe('unit-1');
  });

  it.each(['', ' ', '\t'])(
    'Given blank identifier %j, When created, Then rejects it',
    (value) => {
      expect(() => createEntityId(value)).toThrow(TypeError);
    },
  );

  it('Given an identifier with surrounding whitespace, When created, Then preserves the supplied identifier for stable storage', () => {
    expect(createEntityId(' unit-1 ')).toBe(' unit-1 ');
  });
});
