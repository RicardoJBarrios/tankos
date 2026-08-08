// @vitest-environment node

import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { AquariumName, createAquariumId } from '../domain/aquarium';
import { createMeasurementId, measurementIdFrom } from '../domain/measurement';
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

      const listed = await repository.listOwned(keeper.id, aquarium.id);
      expect(listed.items).toHaveLength(2);
      expect(listed.items.map((item) => item.parameterId)).toEqual([
        'salinity',
        'temperature',
      ]);
      expect(listed.items[0]).toMatchObject({
        canonicalValue: 35,
        canonicalUnit: 'parts-per-thousand',
        measuredAt,
        recordedAt: new Date('2026-08-08T10:06:00.000Z'),
      });

      await signOut(auth);
    },
    20000,
  );

  emulatorTest(
    'orders equal timestamps by MeasurementId and resumes without duplicates',
    async () => {
      const session = new FirebaseKeeperSession();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquarium = await new FirestoreAquariumRepository().establish({
        id: createAquariumId(),
        name: AquariumName.create('Ordenación'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T11:00:00.000Z'),
      });
      const repository = new FirestoreMeasurementRepository();
      const otherAquarium = await new FirestoreAquariumRepository().establish({
        id: createAquariumId(),
        name: AquariumName.create('Otro acuario'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T11:01:00.000Z'),
      });
      const ids = Array.from({ length: 21 }, (_, index) =>
        measurementIdFrom(
          `123e4567-e89b-42d3-a456-426614174${index
            .toString()
            .padStart(3, '0')}`,
        ),
      );
      const measuredAt = new Date('2026-08-08T11:10:00.000Z');
      const recordedAt = new Date('2026-08-08T11:11:00.000Z');

      await repository.record({
        id: createMeasurementId(),
        aquariumId: otherAquarium.id,
        ownerKeeperId: keeper.id,
        parameterId: 'temperature',
        enteredValue: 19,
        enteredUnit: 'celsius',
        canonicalValue: 19,
        canonicalUnit: 'celsius',
        measuredAt,
        recordedAt,
        provenance: 'manual',
      });

      for (const id of ids) {
        await repository.record({
          id,
          aquariumId: aquarium.id,
          ownerKeeperId: keeper.id,
          parameterId: 'temperature',
          enteredValue: 23,
          enteredUnit: 'celsius',
          canonicalValue: 23,
          canonicalUnit: 'celsius',
          measuredAt,
          recordedAt,
          provenance: 'manual',
        });
      }

      const firstPage = await repository.listOwned(keeper.id, aquarium.id);
      const secondPage = await repository.listOwned(
        keeper.id,
        aquarium.id,
        firstPage.nextCursor,
      );
      const listedIds = [...firstPage.items, ...secondPage.items].map(
        (item) => item.id,
      );

      expect(firstPage.items).toHaveLength(20);
      expect(secondPage.items).toHaveLength(1);
      expect(listedIds).toEqual(ids);
      expect(new Set(listedIds).size).toBe(21);

      const { auth } = getFirebaseClient();
      await signOut(auth);
    },
    30000,
  );

  emulatorTest(
    'returns a bounded recent Measurement source page',
    async () => {
      const session = new FirebaseKeeperSession();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquarium = await new FirestoreAquariumRepository().establish({
        id: createAquariumId(),
        name: AquariumName.create('Actividad reciente'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T13:00:00.000Z'),
      });
      const repository = new FirestoreMeasurementRepository();

      await repository.record({
        id: createMeasurementId(),
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        parameterId: 'temperature',
        enteredValue: 24,
        enteredUnit: 'celsius',
        canonicalValue: 24,
        canonicalUnit: 'celsius',
        measuredAt: new Date('2026-08-08T13:02:00.000Z'),
        recordedAt: new Date('2026-08-08T13:03:00.000Z'),
        provenance: 'manual',
      });
      await repository.record({
        id: createMeasurementId(),
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        parameterId: 'temperature',
        enteredValue: 23,
        enteredUnit: 'celsius',
        canonicalValue: 23,
        canonicalUnit: 'celsius',
        measuredAt: new Date('2026-08-08T13:01:00.000Z'),
        recordedAt: new Date('2026-08-08T13:02:00.000Z'),
        provenance: 'manual',
      });

      const items = await repository.listRecentOwned(keeper.id, aquarium.id, 1);

      expect(items).toHaveLength(1);
      expect(items[0]?.canonicalValue).toBe(24);

      const { auth } = getFirebaseClient();
      await signOut(auth);
    },
    20000,
  );
});
