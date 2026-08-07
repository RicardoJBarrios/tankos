import { describe, expect, it } from 'vitest';
import { createAquariumId } from '../domain/aquarium-id';

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

      const ownerRead = await fetch(
        `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/aquariums/${aquariumA}`,
        { headers: { Authorization: `Bearer ${keeperA.idToken}` } },
      );
      expect(ownerRead.status).toBe(200);

      const anonymousRead = await fetch(
        `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/aquariums/${aquariumA}`,
      );
      expect([401, 403]).toContain(anonymousRead.status);

      const privateRead = await fetch(
        `http://127.0.0.1:8080/v1/projects/demo-veril/databases/(default)/documents/aquariums/${aquariumA}`,
        { headers: { Authorization: `Bearer ${keeperB.idToken}` } },
      );

      expect(privateRead.status).toBe(403);
    },
    20000,
  );
});
