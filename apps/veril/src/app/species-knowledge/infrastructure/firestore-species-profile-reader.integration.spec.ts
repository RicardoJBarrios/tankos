// @vitest-environment node

import {
  signInAnonymously,
  signInWithCustomToken,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import {
  createEditorialKeeperToken,
  seedSpeciesProfileFixtures,
  speciesProfileFixtures,
} from './fixtures/species-profiles';
import { FirestoreSpeciesProfileReader } from './firestore-species-profile-reader';
import { speciesProfileIdFrom } from '../domain/species-profile';
import { FirestoreSpeciesProfileDraftWriter } from './firestore-species-profile-draft-writer';

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

  emulatorTest(
    'stores editorial changes in a separate draft document',
    async () => {
      await seedSpeciesProfileFixtures();
      const { auth, firestore } = getFirebaseClient();
      await signInWithCustomToken(auth, await createEditorialKeeperToken());

      await new FirestoreSpeciesProfileDraftWriter().saveDraft({
        speciesProfileId: speciesProfileIdFrom(
          speciesProfileFixtures.clownfish.id,
        ),
        displayName: 'Pez payaso revisado',
        scientificName: speciesProfileFixtures.clownfish.scientificName,
        description: 'Descripción en **Markdown**.',
        sections: speciesProfileFixtures.clownfish.sections,
        sources: speciesProfileFixtures.clownfish.sources.map((source) => ({
          ...source,
          publishedAt: new Date('2026-08-16T00:00:00.000Z'),
        })),
      });

      const draft = await getDoc(
        doc(
          firestore,
          'speciesProfileDrafts',
          speciesProfileFixtures.clownfish.id,
        ),
      );
      expect(draft.data()).toMatchObject({
        speciesProfileId: speciesProfileFixtures.clownfish.id,
        displayName: 'Pez payaso revisado',
        description: 'Descripción en **Markdown**.',
        status: 'draft',
      });
      expect(
        (
          await getDoc(
            doc(
              firestore,
              'speciesProfiles',
              speciesProfileFixtures.clownfish.id,
            ),
          )
        ).data()?.['status'],
      ).toBe('published');

      await signOut(auth);
    },
  );

  emulatorTest('rejects draft writes from anonymous users', async () => {
    await seedSpeciesProfileFixtures();
    const { auth } = getFirebaseClient();
    await signInAnonymously(auth);

    await expect(
      new FirestoreSpeciesProfileDraftWriter().saveDraft({
        speciesProfileId: speciesProfileIdFrom(
          speciesProfileFixtures.clownfish.id,
        ),
        displayName: 'No autorizado',
        description: 'No autorizado',
        sections: speciesProfileFixtures.clownfish.sections,
        sources: speciesProfileFixtures.clownfish.sources,
      }),
    ).rejects.toThrow();

    await signOut(auth);
  });

  emulatorTest('publishes a draft as a new immutable revision', async () => {
    await seedSpeciesProfileFixtures();
    const { auth, firestore } = getFirebaseClient();
    await signInWithCustomToken(auth, await createEditorialKeeperToken());
    const writer = new FirestoreSpeciesProfileDraftWriter();
    const draft = {
      speciesProfileId: speciesProfileIdFrom(
        speciesProfileFixtures.clownfish.id,
      ),
      displayName: 'Pez payaso publicado',
      scientificName: speciesProfileFixtures.clownfish.scientificName,
      description: 'Nueva descripción publicada en **Markdown**.',
      sections: speciesProfileFixtures.clownfish.sections,
      sources: speciesProfileFixtures.clownfish.sources,
    };

    await writer.saveDraft(draft);
    expect(await writer.getDraft(draft.speciesProfileId)).toEqual(draft);

    const publishedAt = new Date('2026-08-16T12:00:00.000Z');
    await writer.publishDraft(draft, 'revision-2', publishedAt);

    expect(
      (
        await getDoc(doc(firestore, 'speciesProfiles', draft.speciesProfileId))
      ).data(),
    ).toMatchObject({
      displayName: 'Pez payaso publicado',
      description: 'Nueva descripción publicada en **Markdown**.',
      revision: { id: 'revision-2' },
      status: 'published',
    });
    expect(
      (
        await getDoc(
          doc(
            firestore,
            'speciesProfileRevisions',
            `${draft.speciesProfileId}_revision-2`,
          ),
        )
      ).data(),
    ).toMatchObject({
      speciesProfileId: draft.speciesProfileId,
      revision: { id: 'revision-2' },
    });
    expect(
      (
        await getDoc(
          doc(firestore, 'speciesProfileDrafts', draft.speciesProfileId),
        )
      ).data(),
    ).toMatchObject({ status: 'published' });

    await signOut(auth);
  });
});
