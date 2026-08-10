// @vitest-environment node

import { signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { AquariumName, createAquariumId } from '../domain/aquarium';
import { plannedCareWorkIdFrom } from '../domain/planned-care-work';
import { FirestoreAquariumRepository } from './firestore-aquarium-repository';
import { FirestorePlannedCareWorkRepository } from './firestore-planned-care-work-repository';
import { FirebaseKeeperSession } from './firebase-keeper-session';
import { getFirebaseClient } from './firebase-client';

const emulatorTest =
  process.env['FIRESTORE_EMULATOR_HOST'] &&
  process.env['FIREBASE_AUTH_EMULATOR_HOST']
    ? it
    : it.skip;

describe('PlannedCareWork persistence (Emulator Suite)', () => {
  emulatorTest(
    'persists and lists planned work separately with deterministic ordering',
    async () => {
      const keeper =
        await new FirebaseKeeperSession().requireAuthenticatedKeeper();
      const aquarium = await new FirestoreAquariumRepository().establish({
        id: createAquariumId(),
        name: AquariumName.create('Planificación'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T10:00:00.000Z'),
      });
      const repository = new FirestorePlannedCareWorkRepository();
      const firstId = plannedCareWorkIdFrom(
        '123e4567-e89b-42d3-a456-426614174101',
      );
      const secondId = plannedCareWorkIdFrom(
        '123e4567-e89b-42d3-a456-426614174102',
      );
      const plannedFor = new Date('2026-08-10T10:00:00.000Z');

      await repository.recordPlanned({
        id: secondId,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        description: 'Segundo',
        plannedFor,
        recordedAt: new Date('2026-08-09T10:01:00.000Z'),
        provenance: 'manual',
      });
      await repository.recordPlanned({
        id: firstId,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        description: 'Primero',
        plannedFor,
        recordedAt: new Date('2026-08-09T10:01:00.000Z'),
        provenance: 'manual',
      });

      const items = await repository.listOwned(keeper.id, aquarium.id, 10);
      expect(items.map((item) => item.id)).toEqual([firstId, secondId]);
      expect(items[0]).toMatchObject({ description: 'Primero', plannedFor });

      const { auth, firestore } = getFirebaseClient();
      const stored = await getDoc(doc(firestore, 'plannedCareWorks', firstId));
      expect(stored.exists()).toBe(true);
      expect(stored.data()?.['provenance']).toBe('manual');
      expect(stored.data()?.['plannedFor'].toDate()).toEqual(plannedFor);

      const completed = await repository.complete({
        id: firstId,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        completedAt: new Date('2026-08-11T10:00:00.000Z'),
      });
      expect(completed.description).toBe('Primero');
      expect(
        (await repository.listOwned(keeper.id, aquarium.id, 10)).map(
          ({ id }) => id,
        ),
      ).toEqual([secondId]);
      const completedDocument = await getDoc(
        doc(firestore, 'careWorks', completed.id),
      );
      expect(completedDocument.exists()).toBe(true);
      expect(completedDocument.data()?.['description']).toBe('Primero');
      expect(completedDocument.data()?.['performedAt'].toDate()).toEqual(
        new Date('2026-08-11T10:00:00.000Z'),
      );

      await repository.cancel({
        id: secondId,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
      });
      expect(
        (await repository.listOwned(keeper.id, aquarium.id, 10)).map(
          ({ id }) => id,
        ),
      ).toEqual([]);
      const careWorks = await getDocs(
        query(
          collection(firestore, 'careWorks'),
          where('ownerId', '==', keeper.id),
          where('aquariumId', '==', aquarium.id),
        ),
      );
      expect(careWorks.docs.map((entry) => entry.id)).not.toContain(secondId);

      await signOut(auth);
    },
    20000,
  );
});
