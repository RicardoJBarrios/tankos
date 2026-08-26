import { createCacheNamespace } from './cache-scope';

describe('createCacheNamespace', () => {
  it('Given a domain scope, When converted, Then returns the root namespace', () => {
    expect(createCacheNamespace({ domain: 'units' })).toBe('tankos:v1:units');
  });

  it('Given a contextual scope, When converted, Then preserves its hierarchy', () => {
    expect(
      createCacheNamespace({
        domain: 'measurements',
        entity: 'list',
        principalId: 'user-1',
        resourceScope: 'resource-1',
      }),
    ).toBe('tankos:v1:measurements:list:user-1:resource-1');
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
