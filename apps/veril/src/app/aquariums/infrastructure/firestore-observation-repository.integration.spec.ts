// @vitest-environment node

import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { AquariumName } from '../domain/aquarium-name';
import { createAquariumId } from '../domain/aquarium-id';
import { getFirebaseClient } from './firebase-client';
import { FirebaseKeeperSession } from './firebase-keeper-session';
import { FirestoreAquariumRepository } from './firestore-aquarium-repository';
import { FirestoreObservationRepository } from './firestore-observation-repository';
import { createObservationId } from '../domain/observation';

const emulatorTest =
  process.env['FIRESTORE_EMULATOR_HOST'] &&
  process.env['FIREBASE_AUTH_EMULATOR_HOST']
    ? it
    : it.skip;

describe('FirestoreObservationRepository (Emulator Suite)', () => {
  emulatorTest(
    'persists an observation for the authenticated keeper and Aquarium',
    async () => {
      const session = new FirebaseKeeperSession();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquariumRepository = new FirestoreAquariumRepository();
      const aquarium = await aquariumRepository.establish({
        id: createAquariumId(),
        name: AquariumName.create('Veril'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T10:00:00.000Z'),
      });
      const recordedAt = new Date('2026-08-08T10:05:00.000Z');
      const observationId = createObservationId();

      const observation = await new FirestoreObservationRepository().record({
        id: observationId,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        content: 'El coral está abierto',
        recordedAt,
      });

      const { auth, firestore } = getFirebaseClient();
      const stored = await getDoc(
        doc(firestore, 'observations', observation.id),
      );

      expect(observation).toMatchObject({
        id: observationId,
        aquariumId: aquarium.id,
        content: 'El coral está abierto',
        recordedAt,
      });
      expect(stored.exists()).toBe(true);
      expect(stored.data()).toMatchObject({
        aquariumId: aquarium.id,
        ownerId: keeper.id,
        content: 'El coral está abierto',
      });

      await signOut(auth);
    },
    20000,
  );
});
