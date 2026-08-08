// @vitest-environment node

import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { createAquariumId } from '../domain/aquarium-id';
import { AquariumName } from '../domain/aquarium-name';
import { createMeasurementId } from '../domain/measurement';
import { getFirebaseClient } from './firebase-client';
import { FirebaseKeeperSession } from './firebase-keeper-session';
import { FirestoreAquariumRepository } from './firestore-aquarium-repository';
import { FirestoreMeasurementRepository } from './firestore-measurement-repository';

const emulatorTest =
  process.env['FIRESTORE_EMULATOR_HOST'] &&
  process.env['FIREBASE_AUTH_EMULATOR_HOST']
    ? it
    : it.skip;

describe('FirestoreMeasurementRepository (Emulator Suite)', () => {
  emulatorTest(
    'persists independent manual measurements for the owner Aquarium',
    async () => {
      const session = new FirebaseKeeperSession();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquarium = await new FirestoreAquariumRepository().establish({
        id: createAquariumId(),
        name: AquariumName.create('Veril'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T10:00:00.000Z'),
      });
      const measuredAt = new Date('2026-08-08T10:02:00.000Z');
      const firstId = createMeasurementId();
      const secondId = createMeasurementId();
      const repository = new FirestoreMeasurementRepository();

      const first = await repository.record({
        id: firstId,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        parameterId: 'temperature',
        enteredValue: 23.5,
        enteredUnit: 'celsius',
        canonicalValue: 23.5,
        canonicalUnit: 'celsius',
        measuredAt,
        recordedAt: new Date('2026-08-08T10:05:00.000Z'),
        provenance: 'manual',
      });
      const second = await repository.record({
        id: secondId,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        parameterId: 'salinity',
        enteredValue: 35,
        enteredUnit: 'parts-per-thousand',
        canonicalValue: 35,
        canonicalUnit: 'parts-per-thousand',
        measuredAt,
        recordedAt: new Date('2026-08-08T10:06:00.000Z'),
        provenance: 'manual',
      });

      const { auth, firestore } = getFirebaseClient();
      const firstStored = await getDoc(
        doc(firestore, 'measurements', first.id),
      );
      const secondStored = await getDoc(
        doc(firestore, 'measurements', second.id),
      );

      expect(first).toMatchObject({
        id: firstId,
        aquariumId: aquarium.id,
        parameterId: 'temperature',
        canonicalUnit: 'celsius',
        measuredAt,
        provenance: 'manual',
      });
      expect(second).toMatchObject({
        id: secondId,
        aquariumId: aquarium.id,
        parameterId: 'salinity',
        canonicalUnit: 'parts-per-thousand',
      });
      expect(firstStored.exists()).toBe(true);
      expect(secondStored.exists()).toBe(true);
      expect(firstStored.data()).toMatchObject({
        ownerId: keeper.id,
        parameterId: 'temperature',
        enteredValue: 23.5,
        enteredUnit: 'celsius',
        canonicalValue: 23.5,
        canonicalUnit: 'celsius',
        provenance: 'manual',
      });
      expect(firstStored.data()?.['measuredAt'].toDate()).toEqual(measuredAt);
      expect(firstStored.data()?.['recordedAt'].toDate()).toEqual(
        new Date('2026-08-08T10:05:00.000Z'),
      );
      expect(secondStored.data()).toMatchObject({
        ownerId: keeper.id,
        parameterId: 'salinity',
        enteredValue: 35,
        canonicalUnit: 'parts-per-thousand',
      });

      await signOut(auth);
    },
    20000,
  );
});
