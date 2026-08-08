// @vitest-environment node

import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { AquariumName, createAquariumId } from '../domain/aquarium';
import { createCareWorkId, careWorkIdFrom } from '../domain/care-work';
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

  emulatorTest(
    'lists recent care work for the active Aquarium in deterministic order',
    async () => {
      const keeper =
        await new FirebaseKeeperSession().requireAuthenticatedKeeper();
      const aquarium = await new FirestoreAquariumRepository().establish({
        id: createAquariumId(),
        name: AquariumName.create('Actividad reciente'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T11:00:00.000Z'),
      });
      const otherAquarium = await new FirestoreAquariumRepository().establish({
        id: createAquariumId(),
        name: AquariumName.create('Otro acuario'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T11:01:00.000Z'),
      });
      const repository = new FirestoreCareWorkRepository();
      const performedAt = new Date('2026-08-08T12:00:00.000Z');
      const recordedAt = new Date('2026-08-08T12:05:00.000Z');
      const firstId = careWorkIdFrom('123e4567-e89b-42d3-a456-426614174001');
      const secondId = careWorkIdFrom('123e4567-e89b-42d3-a456-426614174002');

      await repository.record({
        id: careWorkIdFrom('123e4567-e89b-42d3-a456-426614174003'),
        aquariumId: otherAquarium.id,
        ownerKeeperId: keeper.id,
        description: 'No pertenece al acuario activo',
        performedAt,
        recordedAt,
        provenance: 'manual',
      });
      await repository.record({
        id: secondId,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        description: 'Cuidado con ID mayor',
        performedAt,
        recordedAt,
        provenance: 'manual',
      });
      await repository.record({
        id: firstId,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        description: 'Cuidado con ID menor',
        performedAt,
        recordedAt,
        provenance: 'manual',
      });
      await repository.record({
        id: createCareWorkId(),
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        description: 'Cuidado anterior',
        performedAt: new Date('2026-08-07T12:00:00.000Z'),
        recordedAt: new Date('2026-08-07T12:05:00.000Z'),
        provenance: 'manual',
      });

      const items = await repository.listRecentOwned(keeper.id, aquarium.id, 2);

      expect(items.map((item) => item.id)).toEqual([firstId, secondId]);
      expect(items[0]).toMatchObject({
        description: 'Cuidado con ID menor',
        performedAt,
        recordedAt,
      });

      const { auth } = getFirebaseClient();
      await signOut(auth);
    },
    20000,
  );
});
