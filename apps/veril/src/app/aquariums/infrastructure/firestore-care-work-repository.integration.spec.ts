// @vitest-environment node

import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { AquariumName, createAquariumId } from '../domain/aquarium';
import { createCareWorkId } from '../domain/care-work';
import { FirestoreAquariumRepository } from './firestore-aquarium-repository';
import { FirestoreCareWorkRepository } from './firestore-care-work-repository';
import { FirebaseKeeperSession } from './firebase-keeper-session';
import { getFirebaseClient } from './firebase-client';

const emulatorTest =
  process.env['FIRESTORE_EMULATOR_HOST'] &&
  process.env['FIREBASE_AUTH_EMULATOR_HOST']
    ? it
    : it.skip;

describe('FirestoreCareWorkRepository (Emulator Suite)', () => {
  emulatorTest(
    'persists completed care with both timestamps and manual provenance',
    async () => {
      const keeper =
        await new FirebaseKeeperSession().requireAuthenticatedKeeper();
      const aquarium = await new FirestoreAquariumRepository().establish({
        id: createAquariumId(),
        name: AquariumName.create('Veril'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T10:00:00.000Z'),
      });
      const performedAt = new Date('2026-08-07T10:00:00.000Z');
      const recordedAt = new Date('2026-08-08T10:05:00.000Z');
      const careWork = await new FirestoreCareWorkRepository().record({
        id: createCareWorkId(),
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        description: 'Limpié la copa del skimmer',
        performedAt,
        recordedAt,
        provenance: 'manual',
      });

      const { auth, firestore } = getFirebaseClient();
      const stored = await getDoc(doc(firestore, 'careWorks', careWork.id));

      expect(careWork).toMatchObject({
        aquariumId: aquarium.id,
        description: 'Limpié la copa del skimmer',
        performedAt,
        recordedAt,
        provenance: 'manual',
      });
      const storedData = stored.data();
      expect(storedData).toMatchObject({
        aquariumId: aquarium.id,
        ownerId: keeper.id,
        description: 'Limpié la copa del skimmer',
        provenance: 'manual',
      });
      expect(storedData?.['performedAt'].toDate()).toEqual(performedAt);
      expect(storedData?.['recordedAt'].toDate()).toEqual(recordedAt);

      await signOut(auth);
    },
    20000,
  );
});
