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
import {
  AquariumName,
  aquariumTimeZoneFrom,
  createAquariumId,
} from '../../shared/domain/aquarium-reference';
import { plannedCareWorkIdFrom } from '../../care/domain/planned-care-work';
import { createRecurringCarePlanId } from '../../care/domain/recurring-care-plan';
import { FirestoreAquariumRepository } from '../../aquarium-management/infrastructure/firestore-aquarium-repository';
import { FirestorePlannedCareWorkRepository } from '../../care/infrastructure/firestore-planned-care-work-repository';
import { FirebaseKeeperSession } from '../../shared/infrastructure/firebase-keeper-session';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';

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

  emulatorTest(
    'establishes, advances, cancels and stops a weekly recurring plan atomically',
    async () => {
      const keeper =
        await new FirebaseKeeperSession().requireAuthenticatedKeeper();
      const aquarium = await new FirestoreAquariumRepository().establish({
        id: createAquariumId(),
        name: AquariumName.create('Recurrencia'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T10:00:00.000Z'),
      });
      const repository = new FirestorePlannedCareWorkRepository();
      const planId = createRecurringCarePlanId();
      const firstOccurrenceId = plannedCareWorkIdFrom(
        '123e4567-e89b-42d3-a456-426614174201',
      );
      const zone = aquariumTimeZoneFrom('Atlantic/Canary');

      const plan = await repository.establish({
        id: planId,
        occurrenceId: firstOccurrenceId,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        description: 'Cambio semanal de agua',
        firstOccurrenceAt: new Date('2026-08-16T10:00:00.000Z'),
        recordedAt: new Date('2026-08-10T10:00:00.000Z'),
        timeZone: zone,
      });
      expect(plan.outstandingPlannedCareWorkId).toBe(firstOccurrenceId);
      expect(
        await repository.listOwned(keeper.id, aquarium.id, 10),
      ).toHaveLength(1);

      const { firestore, auth } = getFirebaseClient();
      const aquariumSnapshot = await getDoc(
        doc(firestore, 'aquariums', aquarium.id),
      );
      expect(aquariumSnapshot.data()?.['timeZone']).toBe('Atlantic/Canary');

      const completed = await repository.complete({
        id: firstOccurrenceId,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        completedAt: new Date('2026-08-16T11:00:00.000Z'),
      });
      const afterCompletion = await repository.listOwned(
        keeper.id,
        aquarium.id,
        10,
      );
      expect(afterCompletion).toHaveLength(1);
      expect(afterCompletion[0].provenance).toBe('recurring-plan');
      expect(afterCompletion[0].plannedFor).toEqual(
        new Date('2026-08-23T10:00:00.000Z'),
      );
      expect(
        (await getDoc(doc(firestore, 'careWorks', completed.id))).exists(),
      ).toBe(true);

      await repository.cancel({
        id: afterCompletion[0].id,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        actionAt: new Date('2026-08-23T11:00:00.000Z'),
      });
      const afterCancellation = await repository.listOwned(
        keeper.id,
        aquarium.id,
        10,
      );
      expect(afterCancellation).toHaveLength(1);
      expect(afterCancellation[0].plannedFor).toEqual(
        new Date('2026-08-30T10:00:00.000Z'),
      );

      await repository.stop({
        id: planId,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
      });
      expect(await repository.listOwned(keeper.id, aquarium.id, 10)).toEqual(
        [],
      );
      expect(
        (await getDoc(doc(firestore, 'recurringCarePlans', planId))).exists(),
      ).toBe(false);
      await signOut(auth);
    },
    20000,
  );
});
