// @vitest-environment node

import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { EstablishAquariumInput } from '../application/ports';
import {
  AquariumName,
  aquariumIdFrom,
  aquariumTimeZoneFrom,
  createAquariumId,
} from '../domain/aquarium';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { FirebaseKeeperSession } from '../../shared/infrastructure/firebase-keeper-session';
import { signInAsKeeper } from '../../shared/infrastructure/fixtures/keeper-accounts';
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
      await signInAsKeeper();
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

      expect(ownedByA.items.map((item) => item.name.value)).toEqual([
        'Acuario reciente',
        'Acuario empatado A',
        'Acuario empatado B',
        'Acuario antiguo',
      ]);
      expect(ownedByA.items.map((item) => item.id)).toEqual([
        newer.id,
        tiedFirst.id,
        tiedSecond.id,
        older.id,
      ]);
      expect(firstDocument.exists()).toBe(true);
      expect(secondDocument.exists()).toBe(true);
      expect(
        (await repository.getOwned(keeperA.id, older.id))?.name.value,
      ).toBe('Acuario antiguo');
      await signOut(auth);
      await signInAsKeeper();
      const keeperB = await session.requireAuthenticatedKeeper();
      const aquariumB = await repository.establish({
        id: createAquariumId(),
        name: AquariumName.create('Acuario de B'),
        ownerKeeperId: keeperB.id,
        establishedAt: new Date('2026-01-03T00:00:00.000Z'),
      });

      expect(
        (await repository.listOwned(keeperB.id)).items.map((item) => item.name.value),
      ).toEqual(['Acuario de B']);
      expect(
        (await repository.getOwned(keeperB.id, aquariumB.id))?.name.value,
      ).toBe('Acuario de B');
      await expect(repository.getOwned(keeperB.id, older.id)).rejects.toThrow();
    },
    20000,
  );

  emulatorTest(
    'configures a missing timezone once without changing Aquarium data',
    async () => {
      await signInAsKeeper();
      const session = new FirebaseKeeperSession();
      const repository = new FirestoreAquariumRepository();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquarium = await repository.establish({
        id: createAquariumId(),
        name: AquariumName.create('Acuario timezone'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const configured = await repository.configure({
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        timeZone: aquariumTimeZoneFrom('Atlantic/Canary'),
      });

      expect(configured).toBe('Atlantic/Canary');
      const { firestore } = getFirebaseClient();
      const snapshot = await getDoc(doc(firestore, 'aquariums', aquarium.id));
      expect(snapshot.data()).toMatchObject({
        ownerId: keeper.id,
        name: 'Acuario timezone',
        timeZone: 'Atlantic/Canary',
      });
      expect(snapshot.data()?.['establishedAt'].toDate()).toEqual(
        new Date('2026-01-01T00:00:00.000Z'),
      );

      await expect(
        repository.configure({
          aquariumId: aquarium.id,
          ownerKeeperId: keeper.id,
          timeZone: aquariumTimeZoneFrom('Europe/Madrid'),
        }),
      ).rejects.toThrow('already configured');
    },
    20000,
  );

  emulatorTest(
    'allows exactly one winner for concurrent first configuration',
    async () => {
      await signInAsKeeper();
      const session = new FirebaseKeeperSession();
      const repository = new FirestoreAquariumRepository();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquarium = await repository.establish({
        id: createAquariumId(),
        name: AquariumName.create('Acuario concurrente'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date(),
      });

      const results = await Promise.allSettled([
        repository.configure({
          aquariumId: aquarium.id,
          ownerKeeperId: keeper.id,
          timeZone: aquariumTimeZoneFrom('Atlantic/Canary'),
        }),
        repository.configure({
          aquariumId: aquarium.id,
          ownerKeeperId: keeper.id,
          timeZone: aquariumTimeZoneFrom('Europe/Madrid'),
        }),
      ]);

      expect(
        results.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        results.filter((result) => result.status === 'rejected'),
      ).toHaveLength(1);
      const { firestore } = getFirebaseClient();
      const snapshot = await getDoc(doc(firestore, 'aquariums', aquarium.id));
      expect(['Atlantic/Canary', 'Europe/Madrid']).toContain(
        snapshot.data()?.['timeZone'],
      );
      expect(snapshot.data()?.['name']).toBe('Acuario concurrente');
    },
    20000,
  );

  emulatorTest(
    'configures an approximate location once and reads it back',
    async () => {
      await signInAsKeeper();
      const session = new FirebaseKeeperSession();
      const repository = new FirestoreAquariumRepository();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquarium = await repository.establish({
        id: createAquariumId(),
        name: AquariumName.create('Acuario ubicación'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      const location = await repository.configureLocation({
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        location: {
          latitude: 28.123,
          longitude: -16.456,
          displayName: 'Santa Cruz de Tenerife, España',
        },
      });

      expect(location).toEqual({
        latitude: 28.12,
        longitude: -16.46,
        displayName: 'Santa Cruz de Tenerife, España',
      });
      await expect(
        repository.configureLocation({
          aquariumId: aquarium.id,
          ownerKeeperId: keeper.id,
          location,
        }),
      ).rejects.toThrow('already configured');
      expect(
        (await repository.getOwned(keeper.id, aquarium.id))?.location,
      ).toEqual(location);
    },
    20000,
  );

  emulatorTest(
    'persists, edits and removes bounded Parameter targets without losing another Parameter',
    async () => {
      await signInAsKeeper();
      const session = new FirebaseKeeperSession();
      const repository = new FirestoreAquariumRepository();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquarium = await repository.establish({
        id: createAquariumId(),
        name: AquariumName.create('Acuario objetivos'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      await repository.saveOwned({
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        target: { parameterId: 'temperature', minimum: 24, maximum: 25 },
      });
      await repository.saveOwned({
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        target: { parameterId: 'salinity', minimum: 34, maximum: 35 },
      });
      await repository.saveOwned({
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        target: { parameterId: 'temperature', minimum: 24.5, maximum: 25.5 },
      });

      expect(
        (await repository.getDashboardContextOwned(keeper.id, aquarium.id))
          ?.parameterTargets,
      ).toEqual({
        temperature: {
          parameterId: 'temperature',
          minimum: 24.5,
          maximum: 25.5,
        },
        salinity: { parameterId: 'salinity', minimum: 34, maximum: 35 },
      });

      await repository.removeOwned({
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        parameterId: 'temperature',
      });
      expect(
        (await repository.getDashboardContextOwned(keeper.id, aquarium.id))
          ?.parameterTargets,
      ).toEqual({
        salinity: { parameterId: 'salinity', minimum: 34, maximum: 35 },
      });

      await repository.removeOwned({
        aquariumId: aquarium.id,
        ownerKeeperId: keeper.id,
        parameterId: 'salinity',
      });
      expect(
        (await repository.getDashboardContextOwned(keeper.id, aquarium.id))
          ?.parameterTargets,
      ).toEqual({});
    },
    20000,
  );

  emulatorTest(
    'preserves valid targets during concurrent updates',
    async () => {
      await signInAsKeeper();
      const session = new FirebaseKeeperSession();
      const repository = new FirestoreAquariumRepository();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquarium = await repository.establish({
        id: createAquariumId(),
        name: AquariumName.create('Acuario concurrente'),
        ownerKeeperId: keeper.id,
        establishedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      await Promise.all([
        repository.saveOwned({
          aquariumId: aquarium.id,
          ownerKeeperId: keeper.id,
          target: { parameterId: 'temperature', minimum: 24, maximum: 25 },
        }),
        repository.saveOwned({
          aquariumId: aquarium.id,
          ownerKeeperId: keeper.id,
          target: { parameterId: 'salinity', minimum: 34, maximum: 35 },
        }),
      ]);

      const context = await repository.getDashboardContextOwned(
        keeper.id,
        aquarium.id,
      );
      expect(context?.parameterTargets.temperature).toBeDefined();
      expect(context?.parameterTargets.salinity).toBeDefined();

      const edits = await Promise.allSettled([
        repository.saveOwned({
          aquariumId: aquarium.id,
          ownerKeeperId: keeper.id,
          target: { parameterId: 'temperature', minimum: 24.1, maximum: 25.1 },
        }),
        repository.saveOwned({
          aquariumId: aquarium.id,
          ownerKeeperId: keeper.id,
          target: { parameterId: 'temperature', minimum: 24.2, maximum: 25.2 },
        }),
      ]);
      expect(edits.every((result) => result.status === 'fulfilled')).toBe(true);
      const finalTarget = (
        await repository.getDashboardContextOwned(keeper.id, aquarium.id)
      )?.parameterTargets.temperature;
      expect(finalTarget).toSatisfy(
        (target) => target?.minimum === 24.1 || target?.minimum === 24.2,
      );
      if (!finalTarget) {
        throw new Error('Expected the concurrent target update to persist.');
      }
      expect(finalTarget.maximum).toBe(finalTarget.minimum + 1);
    },
    20000,
  );
});
