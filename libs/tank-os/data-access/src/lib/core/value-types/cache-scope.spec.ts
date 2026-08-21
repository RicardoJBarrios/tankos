import { createCacheNamespace } from './cache-scope';

describe('createCacheNamespace', () => {
  it('Given a domain scope, When converted, Then returns the root namespace', () => {
    expect(createCacheNamespace({ domain: 'units' })).toBe('tankos:units');
  });

  it('Given a contextual scope, When converted, Then preserves its hierarchy', () => {
    expect(
      createCacheNamespace({
        domain: 'measurements',
        entity: 'list',
        principalId: 'user-1',
        aquariumId: 'aquarium-1',
      }),
    ).toBe('tankos:measurements:list:user-1:aquarium-1');
  });

  it('Given an empty or colon-containing segment, When converted, Then rejects it', () => {
    for (const scope of [
      { domain: '' },
      { domain: '  ' },
      { domain: 'units:private' },
      { domain: 'units', entity: 'measurements:all' },
    ]) {
      expect(() => createCacheNamespace(scope)).toThrow(TypeError);
    }
  });
});
