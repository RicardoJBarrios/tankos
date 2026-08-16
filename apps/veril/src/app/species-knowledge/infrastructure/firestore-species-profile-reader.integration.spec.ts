// @vitest-environment node

import {
  signInAnonymously,
  signInWithCustomToken,
  signOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import {
  createEditorialKeeperToken,
  seedSpeciesProfileFixtures,
  speciesProfileFixtures,
} from './fixtures/species-profiles';
import { FirestoreSpeciesProfileReader } from './firestore-species-profile-reader';
import { speciesProfileIdFrom } from '../domain/species-profile';

const emulatorTest = process.env['FIRESTORE_EMULATOR_HOST'] ? it : it.skip;

describe('FirestoreSpeciesProfileReader (Emulator Suite)', () => {
  emulatorTest('exposes only published global profiles', async () => {
    await seedSpeciesProfileFixtures();

    const profiles = await new FirestoreSpeciesProfileReader().listPublished();

    expect(profiles).toEqual([
      {
        id: speciesProfileFixtures.clownfish.id,
        displayName: speciesProfileFixtures.clownfish.displayName,
        scientificName: speciesProfileFixtures.clownfish.scientificName,
        status: 'published',
      },
    ]);
  });

  emulatorTest('rejects client writes to global profiles', async () => {
    await seedSpeciesProfileFixtures();
    const { auth, firestore } = getFirebaseClient();
    await signInAnonymously(auth);

    const profiles = await new FirestoreSpeciesProfileReader().listPublished();
    expect(profiles).toHaveLength(1);

    await expect(
      setDoc(
        doc(firestore, 'speciesProfiles', speciesProfileFixtures.clownfish.id),
        {
          displayName: 'Perfil manipulado',
          status: 'published',
        },
      ),
    ).rejects.toThrow();

    await signOut(auth);
  });

  emulatorTest('reads the published encyclopedic content', async () => {
    await seedSpeciesProfileFixtures();

    const profile = await new FirestoreSpeciesProfileReader().getPublished(
      speciesProfileIdFrom(speciesProfileFixtures.clownfish.id),
    );

    expect(profile).toEqual({
      id: speciesProfileIdFrom(speciesProfileFixtures.clownfish.id),
      displayName: speciesProfileFixtures.clownfish.displayName,
      scientificName: speciesProfileFixtures.clownfish.scientificName,
      status: 'published',
      description: speciesProfileFixtures.clownfish.description,
      sections: speciesProfileFixtures.clownfish.sections,
      sources: speciesProfileFixtures.clownfish.sources,
      revision: {
        id: speciesProfileFixtures.clownfish.revision.id,
        publishedAt: new Date(
          speciesProfileFixtures.clownfish.revision.publishedAt,
        ),
      },
    });
  });

  emulatorTest('allows an editorial keeper to maintain a profile', async () => {
    await seedSpeciesProfileFixtures();
    const { auth, firestore } = getFirebaseClient();
    await signInWithCustomToken(auth, await createEditorialKeeperToken());

    await expect(
      setDoc(
        doc(firestore, 'speciesProfiles', speciesProfileFixtures.clownfish.id),
        {
          displayName: speciesProfileFixtures.clownfish.displayName,
          scientificName: speciesProfileFixtures.clownfish.scientificName,
          description: speciesProfileFixtures.clownfish.description,
          sections: speciesProfileFixtures.clownfish.sections,
          sources: speciesProfileFixtures.clownfish.sources,
          revision: {
            id: speciesProfileFixtures.clownfish.revision.id,
            publishedAt: new Date(
              speciesProfileFixtures.clownfish.revision.publishedAt,
            ),
          },
          status: 'published',
        },
      ),
    ).resolves.toBeUndefined();

    await signOut(auth);
  });
});
