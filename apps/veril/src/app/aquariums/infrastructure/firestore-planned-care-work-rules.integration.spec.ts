import { describe, expect, it } from 'vitest';
import { createAquariumId } from '../domain/aquarium';

const emulatorTest =
  process.env['FIRESTORE_EMULATOR_HOST'] &&
  process.env['FIREBASE_AUTH_EMULATOR_HOST']
    ? it
    : it.skip;

const authUrl =
  'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-veril-api-key';

async function createKeeper() {
  const response = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  return (await response.json()) as { localId: string; idToken: string };
}

async function writeAquarium(id: string, ownerId: string, token: string) {
  return fetch(
    `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/aquariums/${id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          ownerId: { stringValue: ownerId },
          name: { stringValue: 'Planificación' },
          establishedBy: { stringValue: ownerId },
          establishedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    },
  );
}

async function queryPlanned(
  aquariumId: string,
  ownerId: string,
  token?: string,
) {
  return fetch(
    'http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents:runQuery',
    {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'plannedCareWorks' }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: [
                {
                  fieldFilter: {
                    field: { fieldPath: 'aquariumId' },
                    op: 'EQUAL',
                    value: { stringValue: aquariumId },
                  },
                },
                {
                  fieldFilter: {
                    field: { fieldPath: 'ownerId' },
                    op: 'EQUAL',
                    value: { stringValue: ownerId },
                  },
                },
              ],
            },
          },
        },
      }),
    },
  );
}

async function writePlanned(
  id: string,
  aquariumId: string,
  ownerId: string,
  token?: string,
) {
  return fetch(
    `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/plannedCareWorks/${id}`,
    {
      method: 'PATCH',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          aquariumId: { stringValue: aquariumId },
          ownerId: { stringValue: ownerId },
          description: { stringValue: 'Revisar el skimmer' },
          plannedFor: { timestampValue: '2026-08-10T10:00:00.000Z' },
          recordedAt: { timestampValue: '2026-08-09T10:00:00.000Z' },
          provenance: { stringValue: 'manual' },
        },
      }),
    },
  );
}

async function deletePlanned(id: string, token?: string) {
  return fetch(
    `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/plannedCareWorks/${id}`,
    {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
}

function documentName(collection: string, id: string): string {
  return `projects/demo-veril/databases/(default)/documents/${collection}/${id}`;
}

async function commitBatch(
  writes: readonly Record<string, unknown>[],
  token: string,
) {
  return fetch(
    'http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents:commit',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ writes }),
    },
  );
}

function careWorkWrite(
  id: string,
  aquariumId: string,
  ownerId: string,
  description: string,
) {
  return {
    update: {
      name: documentName('careWorks', id),
      fields: {
        aquariumId: { stringValue: aquariumId },
        ownerId: { stringValue: ownerId },
        description: { stringValue: description },
        performedAt: { timestampValue: '2026-08-10T10:00:00.000Z' },
        recordedAt: { timestampValue: '2026-08-10T10:00:00.000Z' },
        provenance: { stringValue: 'manual' },
      },
    },
  };
}

function deleteWrite(collection: string, id: string) {
  return { delete: documentName(collection, id) };
}

describe('plannedCareWorks Security Rules (Emulator Suite)', () => {
  emulatorTest('enforces owner-only planned care access', async () => {
    const owner = await createKeeper();
    const other = await createKeeper();
    const aquariumId = createAquariumId();
    const plannedId = createAquariumId();

    expect(
      (await writeAquarium(aquariumId, owner.localId, owner.idToken)).status,
    ).toBe(200);
    expect(
      (await writePlanned(plannedId, aquariumId, owner.localId, owner.idToken))
        .status,
    ).toBe(200);
    expect(
      (await queryPlanned(aquariumId, owner.localId, owner.idToken)).status,
    ).toBe(200);
    expect([401, 403]).toContain(
      (await queryPlanned(aquariumId, owner.localId)).status,
    );
    expect(
      (await queryPlanned(aquariumId, owner.localId, other.idToken)).status,
    ).toBe(403);
    expect(
      (
        await writePlanned(
          createAquariumId(),
          aquariumId,
          other.localId,
          other.idToken,
        )
      ).status,
    ).toBe(403);
    expect(
      (await writePlanned(createAquariumId(), aquariumId, owner.localId))
        .status,
    ).toBe(403);
    expect((await deletePlanned(plannedId, owner.idToken)).status).toBe(200);
    expect([401, 403]).toContain((await deletePlanned(plannedId)).status);
    expect((await deletePlanned(plannedId, other.idToken)).status).toBe(403);
  });

  emulatorTest('allows only a matching atomic completion batch', async () => {
    const owner = await createKeeper();
    const other = await createKeeper();
    const aquariumA = createAquariumId();
    const aquariumB = createAquariumId();
    const planA = createAquariumId();
    const planB = createAquariumId();
    const planC = createAquariumId();
    const planD = createAquariumId();
    const planE = createAquariumId();
    const planF = createAquariumId();

    for (const [aquariumId, ownerId, token] of [
      [aquariumA, owner.localId, owner.idToken],
      [aquariumB, other.localId, other.idToken],
    ] as const) {
      expect((await writeAquarium(aquariumId, ownerId, token)).status).toBe(
        200,
      );
    }

    for (const planId of [planA, planB, planC, planD, planE, planF]) {
      expect(
        (await writePlanned(planId, aquariumA, owner.localId, owner.idToken))
          .status,
      ).toBe(200);
    }

    // A direct owner delete represents cancellation, not completion.
    expect((await deletePlanned(planA, owner.idToken)).status).toBe(200);

    // A cancellation can coexist with an unrelated authorized Care Work write;
    // the deletion itself is authorized by ownership, not by that other write.
    expect(
      (
        await commitBatch(
          [
            careWorkWrite(
              createAquariumId(),
              aquariumA,
              owner.localId,
              'Revisar el skimmer',
            ),
            deleteWrite('plannedCareWorks', planB),
          ],
          owner.idToken,
        )
      ).status,
    ).toBe(200);

    // A plan in aquarium A cannot be completed by writing care in aquarium B.
    expect(
      (
        await commitBatch(
          [
            careWorkWrite(
              planC,
              aquariumB,
              other.localId,
              'Revisar el skimmer',
            ),
            deleteWrite('plannedCareWorks', planC),
          ],
          owner.idToken,
        )
      ).status,
    ).toBe(403);

    // A matching ID with altered source data is not the completion of the plan.
    expect(
      (
        await commitBatch(
          [
            careWorkWrite(
              planD,
              aquariumA,
              owner.localId,
              'Descripción alterada',
            ),
            deleteWrite('plannedCareWorks', planD),
          ],
          owner.idToken,
        )
      ).status,
    ).toBe(403);

    // A different keeper cannot complete the owner's plan.
    expect(
      (
        await commitBatch(
          [
            careWorkWrite(
              planE,
              aquariumA,
              owner.localId,
              'Revisar el skimmer',
            ),
            deleteWrite('plannedCareWorks', planE),
          ],
          other.idToken,
        )
      ).status,
    ).toBe(403);

    // The exact application protocol is allowed.
    expect(
      (
        await commitBatch(
          [
            careWorkWrite(
              planF,
              aquariumA,
              owner.localId,
              'Revisar el skimmer',
            ),
            deleteWrite('plannedCareWorks', planF),
          ],
          owner.idToken,
        )
      ).status,
    ).toBe(200);
  });
});
