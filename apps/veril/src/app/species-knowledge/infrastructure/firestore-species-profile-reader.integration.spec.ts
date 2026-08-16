// @vitest-environment node

import { doc, setDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import {
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
    const { firestore } = getFirebaseClient();

    await expect(
      setDoc(
        doc(firestore, 'speciesProfiles', speciesProfileFixtures.clownfish.id),
        {
          displayName: 'Perfil manipulado',
          status: 'published',
        },
      ),
    ).rejects.toThrow();
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
});
