// @vitest-environment node

import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { AquariumName, createAquariumId } from '../domain/aquarium';
import { getFirebaseClient } from './firebase-client';
import { FirebaseKeeperSession } from './firebase-keeper-session';
import { FirestoreAquariumRepository } from './firestore-aquarium-repository';
import { FirestoreObservationRepository } from './firestore-observation-repository';
import { createObservationId, observationIdFrom } from '../domain/observation';

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

  emulatorTest(
    'lists only the active Aquarium observations in deterministic order',
    async () => {
      const session = new FirebaseKeeperSession();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquarium = await new FirestoreAquariumRepository().establish({
        id: createAquariumId(),
        name: AquariumName.create('Veril histórico'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T10:00:00.000Z'),
      });
      const otherAquarium = await new FirestoreAquariumRepository().establish({
        id: createAquariumId(),
        name: AquariumName.create('Otro acuario'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T10:01:00.000Z'),
      });
      const recordedAt = new Date('2026-08-08T10:05:00.000Z');
      const repository = new FirestoreObservationRepository();
      const oldest = observationIdFrom('123e4567-e89b-42d3-a456-426614174003');
      const newest = observationIdFrom('123e4567-e89b-42d3-a456-426614174001');
      const tieBreak = observationIdFrom(
        '123e4567-e89b-42d3-a456-426614174002',
      );
      await repository.record({
        id: observationIdFrom('123e4567-e89b-42d3-a456-426614174004'),
        aquariumId: otherAquarium.id,
        ownerKeeperId: keeper.id,
        content: 'No pertenece al acuario activo',
        recordedAt,
      });

      await repository.record({
        id: oldest,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        content: 'Observación antigua',
        recordedAt: new Date('2026-08-07T10:00:00.000Z'),
      });
      await repository.record({
        id: tieBreak,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        content: 'Observación con ID mayor',
        recordedAt,
      });
      await repository.record({
        id: newest,
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        content: 'Observación con ID menor',
        recordedAt,
      });

      const items = await repository.listOwned(keeper.id, aquarium.id);

      expect(items.map((item) => item.id)).toEqual([newest, tieBreak, oldest]);
      expect(items.map((item) => item.content)).toEqual([
        'Observación con ID menor',
        'Observación con ID mayor',
        'Observación antigua',
      ]);
      expect(items[0]?.recordedAt).toEqual(recordedAt);

      const { auth } = getFirebaseClient();
      await signOut(auth);
    },
    20000,
  );

  emulatorTest(
    'returns a bounded recent Observation source page',
    async () => {
      const session = new FirebaseKeeperSession();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquarium = await new FirestoreAquariumRepository().establish({
        id: createAquariumId(),
        name: AquariumName.create('Actividad reciente'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-08-08T12:00:00.000Z'),
      });
      const repository = new FirestoreObservationRepository();

      await repository.record({
        id: createObservationId(),
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        content: 'Más reciente',
        recordedAt: new Date('2026-08-08T12:02:00.000Z'),
      });
      await repository.record({
        id: createObservationId(),
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        content: 'Más antigua',
        recordedAt: new Date('2026-08-08T12:01:00.000Z'),
      });

      const items = await repository.listRecentOwned(keeper.id, aquarium.id, 1);

      expect(items).toHaveLength(1);
      expect(items[0]?.content).toBe('Más reciente');

      const { auth } = getFirebaseClient();
      await signOut(auth);
    },
    20000,
  );
});
