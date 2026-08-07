// @vitest-environment node

import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { EstablishAquariumInput } from '../application/aquarium-ports';
import { aquariumIdFrom, createAquariumId } from '../domain/aquarium-id';
import { AquariumName } from '../domain/aquarium-name';
import { getFirebaseClient } from './firebase-client';
import { FirebaseKeeperSession } from './firebase-keeper-session';
import { FirestoreAquariumRepository } from './firestore-aquarium-repository';

const emulatorTest =
  process.env['FIRESTORE_EMULATOR_HOST'] &&
  process.env['FIREBASE_AUTH_EMULATOR_HOST']
    ? it
    : it.skip;

describe('FirestoreAquariumRepository (Emulator Suite)', () => {
  emulatorTest(
    "lists only the authenticated keeper's Aquariums",
    async () => {
      const session = new FirebaseKeeperSession();
      const repository = new FirestoreAquariumRepository();
      const keeperA = await session.requireAuthenticatedKeeper();
      const makeInput = (
        name: string,
        establishedAt: string,
      ): EstablishAquariumInput => ({
        id: createAquariumId(),
        name: AquariumName.create(name),
        ownerKeeperId: keeperA.id,
        establishedAt: new Date(establishedAt),
      });

      expect(await repository.listOwned(keeperA.id)).toEqual([]);

      const older = await repository.establish(
        makeInput('Acuario antiguo', '2026-01-01T00:00:00.000Z'),
      );
      const newer = await repository.establish(
        makeInput('Acuario reciente', '2026-01-02T00:00:00.000Z'),
      );
      const tiedTimestamp = new Date('2026-01-01T12:00:00.000Z');
      const tiedFirst = await repository.establish({
        id: aquariumIdFrom('00000000-0000-4000-8000-000000000001'),
        name: AquariumName.create('Acuario empatado A'),
        ownerKeeperId: keeperA.id,
        establishedAt: tiedTimestamp,
      });
      const tiedSecond = await repository.establish({
        id: aquariumIdFrom('00000000-0000-4000-8000-000000000002'),
        name: AquariumName.create('Acuario empatado B'),
        ownerKeeperId: keeperA.id,
        establishedAt: tiedTimestamp,
      });
      const { auth, firestore } = getFirebaseClient();
      const firstDocument = await getDoc(doc(firestore, 'aquariums', older.id));
      const secondDocument = await getDoc(
        doc(firestore, 'aquariums', newer.id),
      );
      const ownedByA = await repository.listOwned(keeperA.id);

      expect(ownedByA.map((item) => item.name.value)).toEqual([
        'Acuario reciente',
        'Acuario empatado A',
        'Acuario empatado B',
        'Acuario antiguo',
      ]);
      expect(ownedByA.map((item) => item.id)).toEqual([
        newer.id,
        tiedFirst.id,
        tiedSecond.id,
        older.id,
      ]);
      expect(firstDocument.exists()).toBe(true);
      expect(secondDocument.exists()).toBe(true);

      await signOut(auth);
      const keeperB = await session.requireAuthenticatedKeeper();
      await repository.establish({
        id: createAquariumId(),
        name: AquariumName.create('Acuario de B'),
        ownerKeeperId: keeperB.id,
        establishedAt: new Date('2026-01-03T00:00:00.000Z'),
      });

      expect(
        (await repository.listOwned(keeperB.id)).map((item) => item.name.value),
      ).toEqual(['Acuario de B']);
    },
    20000,
  );
});
