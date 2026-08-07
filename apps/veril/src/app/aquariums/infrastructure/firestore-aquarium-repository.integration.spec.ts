// @vitest-environment node

import { doc, getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { EstablishAquariumInput } from '../application/aquarium-ports';
import { createAquariumId } from '../domain/aquarium-id';
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
    'persists independent Aquariums through the Firebase SDK',
    async () => {
      const session = new FirebaseKeeperSession();
      const repository = new FirestoreAquariumRepository();
      const keeper = await session.requireAuthenticatedKeeper();
      const makeInput = (name: string): EstablishAquariumInput => ({
        id: createAquariumId(),
        name: AquariumName.create(name),
        ownerKeeperId: keeper.id,
        establishedAt: new Date(),
      });

      const first = await repository.establish(makeInput('Acuario A'));
      const second = await repository.establish(makeInput('Acuario B'));
      const { firestore } = getFirebaseClient();
      const firstDocument = await getDoc(doc(firestore, 'aquariums', first.id));
      const secondDocument = await getDoc(
        doc(firestore, 'aquariums', second.id),
      );

      expect(first.id).not.toBe(second.id);
      expect(first.ownerKeeperId).toBe(keeper.id);
      expect(second.ownerKeeperId).toBe(keeper.id);
      expect(firstDocument.exists()).toBe(true);
      expect(secondDocument.exists()).toBe(true);
      expect(firstDocument.data()?.['name']).toBe('Acuario A');
      expect(secondDocument.data()?.['name']).toBe('Acuario B');
    },
    20000,
  );
});
