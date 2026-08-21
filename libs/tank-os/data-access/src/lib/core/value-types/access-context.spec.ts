import { createEntityId } from './entity-id';
import { createAccessContext } from './access-context';

describe('createAccessContext', () => {
  it('Given a valid principal and role, When created, Then returns a defensive role copy', () => {
    const roles = ['keeper'] as const;
    const context = createAccessContext({
      principalId: createEntityId('keeper'),
      roles,
      aquariumId: createEntityId('aquarium'),
    });

    expect(context).toEqual({
      principalId: 'keeper',
      roles: ['keeper'],
      aquariumId: 'aquarium',
    });
    expect(context.roles).not.toBe(roles);
  });

  it.each([
    undefined,
    null,
    { principalId: '', roles: ['keeper'] },
    { principalId: 'keeper', roles: [] },
    { principalId: 'keeper', roles: [42] },
    { principalId: 'keeper', roles: ['keeper'], aquariumId: ' ' },
  ])('Given malformed access metadata, When created, Then rejects it', (context) => {
    expect(() => createAccessContext(context as never)).toThrow(TypeError);
  });
});
