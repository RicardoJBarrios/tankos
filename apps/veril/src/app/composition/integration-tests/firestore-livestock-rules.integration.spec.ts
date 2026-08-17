// @vitest-environment node

import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { EstablishAquarium } from '../../aquarium-management/application/establish-aquarium';
import { FirestoreAquariumRepository } from '../../aquarium-management/infrastructure/firestore-aquarium-repository';
import { AddLivestock } from '../../livestock/application/add-livestock';
import { FirestoreLivestockRepository } from '../../livestock/infrastructure/firestore-livestock-repository';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../shared/application/active-aquarium-context-storage';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { FirebaseKeeperSession } from '../../shared/infrastructure/firebase-keeper-session';
import { signInAsKeeper } from '../../shared/infrastructure/fixtures/keeper-accounts';
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

describe('Livestock Security Rules (Emulator Suite)', () => {
  emulatorTest(
    'enforces published-profile and immutable-record boundaries',
    async () => {
      await seedSpeciesProfileFixtures();

      await signInAsKeeper();
      const session = new FirebaseKeeperSession();
      const keeper = await session.requireAuthenticatedKeeper();
      const aquarium = await new EstablishAquarium(
        new FirestoreAquariumRepository(),
        session,
      ).execute('Acuario de reglas');
      const context = new ActiveAquariumContext(contextStorage);
      context.select(aquarium.id);
      const repository = new FirestoreLivestockRepository();

      await expect(
        new AddLivestock(repository, session, context).execute({
          speciesProfileId: speciesProfileFixtures.retiredWrasse.id,
          category: 'fish',
          representation: 'individual',
          displayName: 'No debería entrar',
        }),
      ).rejects.toThrow();

      await new AddLivestock(repository, session, context).execute({
        speciesProfileId: speciesProfileFixtures.clownfish.id,
        category: 'fish',
        representation: 'individual',
        displayName: 'Nemo protegido',
      });
      const { items } = await repository.listActiveOwned(
        keeper.id,
        aquarium.id,
      );
      const [created] = items;
      const { firestore } = getFirebaseClient();
      const reference = doc(firestore, 'livestock', created.id);

      await expect(
        updateDoc(reference, { displayName: 'Manipulado' }),
      ).rejects.toThrow();
      await expect(deleteDoc(reference)).rejects.toThrow();
    },
  );
});
