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
  const result = (await response.json()) as {
    localId: string;
    idToken: string;
  };

  return result;
}

async function writeAquarium(
  id: string,
  ownerId: string,
  token: string,
  name: string,
) {
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
          name: { stringValue: name },
          establishedBy: { stringValue: ownerId },
          establishedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    },
  );
}

async function queryAquariums(ownerId: string, token?: string) {
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
          from: [{ collectionId: 'aquariums' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'ownerId' },
              op: 'EQUAL',
              value: { stringValue: ownerId },
            },
          },
        },
      }),
    },
  );
}

async function queryObservations(
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
          from: [{ collectionId: 'observations' }],
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
          orderBy: [
            { field: { fieldPath: 'recordedAt' }, direction: 'DESCENDING' },
            { field: { fieldPath: '__name__' }, direction: 'ASCENDING' },
          ],
        },
      }),
    },
  );
}

async function writeObservation(
  id: string,
  aquariumId: string,
  ownerId: string,
  token?: string,
) {
  return fetch(
    `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/observations/${id}`,
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
          content: { stringValue: 'El coral está abierto' },
          recordedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    },
  );
}

async function writeMeasurement(
  id: string,
  aquariumId: string,
  ownerId: string,
  token?: string,
  overrides: Record<string, unknown> = {},
) {
  const fields = {
    aquariumId: { stringValue: aquariumId },
    ownerId: { stringValue: ownerId },
    parameterId: { stringValue: 'temperature' },
    enteredValue: { doubleValue: 23.5 },
    enteredUnit: { stringValue: 'celsius' },
    canonicalValue: { doubleValue: 23.5 },
    canonicalUnit: { stringValue: 'celsius' },
    measuredAt: { timestampValue: new Date().toISOString() },
    recordedAt: { timestampValue: new Date().toISOString() },
    provenance: { stringValue: 'manual' },
    ...overrides,
  };

  return fetch(
    `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/measurements/${id}`,
    {
      method: 'PATCH',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    },
  );
}

async function queryMeasurements(
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
          from: [{ collectionId: 'measurements' }],
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

async function queryCareWorks(
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
          from: [{ collectionId: 'careWorks' }],
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

async function writeCareWork(
  id: string,
  aquariumId: string,
  ownerId: string,
  token?: string,
  overrides: Record<string, unknown> = {},
) {
  const fields = {
    aquariumId: { stringValue: aquariumId },
    ownerId: { stringValue: ownerId },
    description: { stringValue: 'Limpié la copa del skimmer' },
    performedAt: { timestampValue: new Date().toISOString() },
    recordedAt: { timestampValue: new Date().toISOString() },
    provenance: { stringValue: 'manual' },
    ...overrides,
  };

  return fetch(
    `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/careWorks/${id}`,
    {
      method: 'PATCH',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    },
  );
}

describe('Firestore Security Rules (Emulator Suite)', () => {
  emulatorTest(
    'allow independent Aquariums and isolate owners',
    async () => {
      const keeperA = await createKeeper();
      const keeperB = await createKeeper();
      const aquariumA = createAquariumId();
      const aquariumB = createAquariumId();

      expect(
        (
          await writeAquarium(
            aquariumA,
            keeperA.localId,
            keeperA.idToken,
            'Acuario A',
          )
        ).status,
      ).toBe(200);

      const observationId = createAquariumId();
      expect(
        (
          await writeObservation(
            observationId,
            aquariumA,
            keeperA.localId,
            keeperA.idToken,
          )
        ).status,
      ).toBe(200);
      const ownerObservationRead = await fetch(
        `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/observations/${observationId}`,
        { headers: { Authorization: `Bearer ${keeperA.idToken}` } },
      );
      expect(ownerObservationRead.status).toBe(200);

      const anonymousObservationRead = await fetch(
        `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/observations/${observationId}`,
      );
      expect([401, 403]).toContain(anonymousObservationRead.status);

      const crossOwnerObservationRead = await fetch(
        `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/observations/${observationId}`,
        { headers: { Authorization: `Bearer ${keeperB.idToken}` } },
      );
      expect(crossOwnerObservationRead.status).toBe(403);
      const ownerObservationQuery = await queryObservations(
        aquariumA,
        keeperA.localId,
        keeperA.idToken,
      );
      expect(ownerObservationQuery.status).toBe(200);
      expect(
        (await ownerObservationQuery.text()).match(/"document"/g),
      ).toHaveLength(1);
      expect(
        [401, 403].includes(
          (await queryObservations(aquariumA, keeperA.localId)).status,
        ),
      ).toBe(true);
      expect(
        (await queryObservations(aquariumA, keeperA.localId, keeperB.idToken))
          .status,
      ).toBe(403);
      expect(
        (await writeObservation(createAquariumId(), aquariumA, keeperA.localId))
          .status,
      ).toBe(403);
      expect(
        (
          await writeObservation(
            createAquariumId(),
            aquariumA,
            keeperB.localId,
            keeperB.idToken,
          )
        ).status,
      ).toBe(403);
      const measurementId = createAquariumId();
      expect(
        (
          await writeMeasurement(
            measurementId,
            aquariumA,
            keeperA.localId,
            keeperA.idToken,
          )
        ).status,
      ).toBe(200);
      const ownerMeasurementQuery = await queryMeasurements(
        aquariumA,
        keeperA.localId,
        keeperA.idToken,
      );
      expect(ownerMeasurementQuery.status).toBe(200);
      expect(
        (await ownerMeasurementQuery.text()).match(/"document"/g),
      ).toHaveLength(1);

      const anonymousMeasurementQuery = await queryMeasurements(
        aquariumA,
        keeperA.localId,
      );
      expect([401, 403]).toContain(anonymousMeasurementQuery.status);

      const crossOwnerMeasurementQuery = await queryMeasurements(
        aquariumA,
        keeperA.localId,
        keeperB.idToken,
      );
      expect(crossOwnerMeasurementQuery.status).toBe(403);
      expect(
        (await writeMeasurement(createAquariumId(), aquariumA, keeperA.localId))
          .status,
      ).toBe(403);
      expect(
        (
          await writeMeasurement(
            createAquariumId(),
            aquariumA,
            keeperB.localId,
            keeperB.idToken,
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await writeMeasurement(
            createAquariumId(),
            aquariumA,
            keeperA.localId,
            keeperA.idToken,
            { ownerId: { stringValue: keeperB.localId } },
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await writeMeasurement(
            createAquariumId(),
            aquariumA,
            keeperA.localId,
            keeperA.idToken,
            {
              parameterId: { stringValue: 'temperature' },
              enteredValue: { stringValue: 'bad' },
            },
          )
        ).status,
      ).toBe(403);
      const careWorkId = createAquariumId();
      expect(
        (
          await writeCareWork(
            careWorkId,
            aquariumA,
            keeperA.localId,
            keeperA.idToken,
          )
        ).status,
      ).toBe(200);
      const ownerCareWorkRead = await fetch(
        `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/careWorks/${careWorkId}`,
        { headers: { Authorization: `Bearer ${keeperA.idToken}` } },
      );
      expect(ownerCareWorkRead.status).toBe(200);
      const ownerCareWorkQuery = await queryCareWorks(
        aquariumA,
        keeperA.localId,
        keeperA.idToken,
      );
      expect(ownerCareWorkQuery.status).toBe(200);
      expect(
        (await ownerCareWorkQuery.text()).match(/"document"/g),
      ).toHaveLength(1);
      expect(
        [401, 403].includes(
          (await queryCareWorks(aquariumA, keeperA.localId)).status,
        ),
      ).toBe(true);
      expect(
        (await queryCareWorks(aquariumA, keeperA.localId, keeperB.idToken))
          .status,
      ).toBe(403);
      const anonymousCareWorkRead = await fetch(
        `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/careWorks/${careWorkId}`,
      );
      expect([401, 403]).toContain(anonymousCareWorkRead.status);
      const crossOwnerCareWorkRead = await fetch(
        `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/careWorks/${careWorkId}`,
        { headers: { Authorization: `Bearer ${keeperB.idToken}` } },
      );
      expect(crossOwnerCareWorkRead.status).toBe(403);
      expect(
        (await writeCareWork(createAquariumId(), aquariumA, keeperA.localId))
          .status,
      ).toBe(403);
      expect(
        (
          await writeCareWork(
            createAquariumId(),
            aquariumA,
            keeperB.localId,
            keeperB.idToken,
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await writeCareWork(
            createAquariumId(),
            aquariumA,
            keeperA.localId,
            keeperA.idToken,
            { ownerId: { stringValue: keeperB.localId } },
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await writeAquarium(
            aquariumB,
            keeperA.localId,
            keeperA.idToken,
            'Acuario B',
          )
        ).status,
      ).toBe(200);

      const ownerQuery = await queryAquariums(keeperA.localId, keeperA.idToken);
      expect(ownerQuery.status).toBe(200);
      const ownerQueryBody = await ownerQuery.text();
      expect(ownerQueryBody.match(/"document"/g)).toHaveLength(2);

      const ownerRead = await fetch(
        `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/aquariums/${aquariumA}`,
        { headers: { Authorization: `Bearer ${keeperA.idToken}` } },
      );
      expect(ownerRead.status).toBe(200);

      const anonymousRead = await fetch(
        `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/aquariums/${aquariumA}`,
      );
      expect([401, 403]).toContain(anonymousRead.status);

      const anonymousQuery = await queryAquariums(keeperA.localId);
      expect([401, 403]).toContain(anonymousQuery.status);

      const privateRead = await fetch(
        `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/aquariums/${aquariumA}`,
        { headers: { Authorization: `Bearer ${keeperB.idToken}` } },
      );

      expect(privateRead.status).toBe(403);

      const crossOwnerQuery = await queryAquariums(
        keeperB.localId,
        keeperA.idToken,
      );
      expect(crossOwnerQuery.status).toBe(403);
    },
    20000,
  );
});
