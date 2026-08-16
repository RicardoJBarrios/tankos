// @vitest-environment node

import { signOut } from 'firebase/auth';
import { describe, expect, it } from 'vitest';
import { EstablishAquarium } from '../../aquarium-management/application/establish-aquarium';
import { FirestoreAquariumRepository } from '../../aquarium-management/infrastructure/firestore-aquarium-repository';
import { AddLivestock } from '../../livestock/application/add-livestock';
import { RemoveLivestock } from '../../livestock/application/remove-livestock';
import { TransferLivestock } from '../../livestock/application/transfer-livestock';
import { FirestoreLivestockRepository } from '../../livestock/infrastructure/firestore-livestock-repository';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../shared/application/active-aquarium-context-storage';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { FirebaseKeeperSession } from '../../shared/infrastructure/firebase-keeper-session';
import {
  seedSpeciesProfileFixtures,
  speciesProfileFixtures,
} from '../../species-knowledge/infrastructure/fixtures/species-profiles';

const emulatorTest =
  process.env['FIRESTORE_EMULATOR_HOST'] &&
  process.env['FIREBASE_AUTH_EMULATOR_HOST']
    ? it
    : it.skip;

const contextStorage: ActiveAquariumContextStorage = {
  load: () => null,
  save: () => undefined,
  clear: () => undefined,
};

describe('Livestock composition (Emulator Suite)', () => {
  emulatorTest(
    'completes add, transfer and soft removal with published species fixtures',
    async () => {
      await seedSpeciesProfileFixtures();

      const session = new FirebaseKeeperSession();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquariumRepository = new FirestoreAquariumRepository();
      const firstAquarium = await new EstablishAquarium(
        aquariumRepository,
        session,
      ).execute('Acuario de origen');
      const secondAquarium = await new EstablishAquarium(
        aquariumRepository,
        session,
      ).execute('Acuario de destino');
      const context = new ActiveAquariumContext(contextStorage);
      const livestockRepository = new FirestoreLivestockRepository();

      context.select(firstAquarium.id);
      await new AddLivestock(livestockRepository, session, context).execute({
        speciesProfileId: speciesProfileFixtures.clownfish.id,
        category: 'fish',
        representation: 'individual',
        displayName: 'Nemo',
      });

      const activeInOrigin = await livestockRepository.listActiveOwned(
        keeper.id,
        firstAquarium.id,
      );
      expect(activeInOrigin).toHaveLength(1);
      expect(activeInOrigin[0]).toMatchObject({
        speciesProfileId: speciesProfileFixtures.clownfish.id,
        aquariumId: firstAquarium.id,
        lifecycle: 'active',
      });

      await new TransferLivestock(
        livestockRepository,
        session,
        context,
      ).execute(activeInOrigin[0].id, secondAquarium.id);

      const transferred = await livestockRepository.getOwned(
        keeper.id,
        activeInOrigin[0].id,
      );
      expect(transferred).toMatchObject({
        aquariumId: secondAquarium.id,
        lifecycle: 'active',
      });
      expect(transferred?.associationHistory).toHaveLength(2);
      expect(transferred?.associationHistory[0]).toMatchObject({
        aquariumId: firstAquarium.id,
        endedAt: expect.any(Date),
      });
      expect(transferred?.associationHistory[1]).toMatchObject({
        aquariumId: secondAquarium.id,
        associatedAt: expect.any(Date),
      });

      context.select(secondAquarium.id);
      await new RemoveLivestock(livestockRepository, session, context).execute(
        activeInOrigin[0].id,
      );

      const removed = await livestockRepository.getOwned(
        keeper.id,
        activeInOrigin[0].id,
      );
      expect(removed).toMatchObject({
        aquariumId: secondAquarium.id,
        lifecycle: 'removed',
      });
      expect(removed?.associationHistory).toHaveLength(2);
      expect(
        await livestockRepository.listActiveOwned(keeper.id, secondAquarium.id),
      ).toEqual([]);

      await signOut(getFirebaseClient().auth);
    },
    20000,
  );
});
