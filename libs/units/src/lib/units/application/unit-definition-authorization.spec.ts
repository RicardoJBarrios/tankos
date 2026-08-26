import { createAuthorizationPort } from '@tankos/authz';
import { createEntityId } from '@tankos/data-access';
import { describe, expect, it } from 'vitest';
import {
  UNIT_DEFINITION_RESOURCE,
  unitDefinitionAuthorizationPolicy,
} from './unit-definition-authorization';

describe('unitDefinitionAuthorizationPolicy', () => {
  const keeper = { id: createEntityId('keeper-1'), roles: ['keeper'] };
  const admin = { id: createEntityId('admin-1'), roles: ['admin'] };
  const privateUnit = {
    type: UNIT_DEFINITION_RESOURCE,
    id: createEntityId('unit-1'),
    attributes: { ownerId: keeper.id, visibility: 'private' as const },
  };
  const globalUnit = {
    ...privateUnit,
    attributes: { ownerId: keeper.id, visibility: 'global' as const },
  };

  it('allows a keeper to create and manage a private unit they own', async () => {
    const authorization = createAuthorizationPort(
      unitDefinitionAuthorizationPolicy,
    );

    for (const action of [
      'create',
      'read',
      'use',
      'update',
      'delete',
      'restore',
    ]) {
      await expect(
        authorization.can({ subject: keeper, action, resource: privateUnit }),
      ).resolves.toBe(true);
    }
  });

  it('allows keepers to use global units but not change them', async () => {
    const authorization = createAuthorizationPort(
      unitDefinitionAuthorizationPolicy,
    );

    await expect(
      authorization.can({
        subject: keeper,
        action: 'read',
        resource: globalUnit,
      }),
    ).resolves.toBe(true);
    await expect(
      authorization.can({
        subject: keeper,
        action: 'use',
        resource: globalUnit,
      }),
    ).resolves.toBe(true);
    await expect(
      authorization.can({
        subject: keeper,
        action: 'update',
        resource: globalUnit,
      }),
    ).resolves.toBe(false);
    await expect(
      authorization.can({
        subject: keeper,
        action: 'delete',
        resource: globalUnit,
      }),
    ).resolves.toBe(false);
    await expect(
      authorization.can({
        subject: keeper,
        action: 'globalize',
        resource: privateUnit,
      }),
    ).resolves.toBe(false);
  });

  it('denies a keeper access to another keeper private unit', async () => {
    const authorization = createAuthorizationPort(
      unitDefinitionAuthorizationPolicy,
    );

    await expect(
      authorization.can({
        subject: { id: createEntityId('keeper-2'), roles: ['keeper'] },
        action: 'read',
        resource: privateUnit,
      }),
    ).resolves.toBe(false);
  });

  it('allows an admin to globalize and manage global units', async () => {
    const authorization = createAuthorizationPort(
      unitDefinitionAuthorizationPolicy,
    );

    await expect(
      authorization.can({
        subject: admin,
        action: 'globalize',
        resource: privateUnit,
      }),
    ).resolves.toBe(true);
    await expect(
      authorization.can({
        subject: admin,
        action: 'update',
        resource: globalUnit,
      }),
    ).resolves.toBe(true);
    await expect(
      authorization.can({
        subject: admin,
        action: 'delete',
        resource: globalUnit,
      }),
    ).resolves.toBe(true);
    await expect(
      authorization.can({
        subject: admin,
        action: 'create',
        resource: {
          ...privateUnit,
          attributes: { visibility: 'global' as const },
        },
      }),
    ).resolves.toBe(true);
  });

  it('denies invalid resources, unknown roles and repeated globalization', async () => {
    const authorization = createAuthorizationPort(
      unitDefinitionAuthorizationPolicy,
    );

    await expect(
      authorization.can({
        subject: { id: keeper.id, roles: ['viewer'] },
        action: 'read',
        resource: privateUnit,
      }),
    ).resolves.toBe(false);
    await expect(
      authorization.can({
        subject: admin,
        action: 'globalize',
        resource: globalUnit,
      }),
    ).resolves.toBe(false);
    await expect(
      authorization.can({
        subject: admin,
        action: 'read',
        resource: { ...privateUnit, type: 'other-resource' },
      }),
    ).resolves.toBe(false);
  });
});
