import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = 'demo-veril';

export const speciesProfileFixtures = {
  clownfish: {
    id: '123e4567-e89b-42d3-a456-426614174100',
    displayName: 'Pez payaso',
    scientificName: 'Amphiprion ocellaris',
    description: 'Contenido documental de prueba para el perfil publicado.',
    sections: [
      {
        key: 'identification',
        title: 'Identificación',
        content: 'Contenido de identificación pendiente de revisión editorial.',
      },
    ],
    sources: [
      {
        id: 'fixture-source-1',
        title: 'Fuente documental de prueba',
        url: 'https://example.test/species/clownfish',
      },
    ],
    revision: {
      id: 'fixture-revision-1',
      publishedAt: '2026-08-16T00:00:00.000Z',
    },
  },
  retiredWrasse: {
    id: '123e4567-e89b-42d3-a456-426614174101',
    displayName: 'Lábrido retirado',
    scientificName: 'Halichoeres ficticius',
    description: 'Contenido documental de prueba para el perfil retirado.',
    sections: [
      {
        key: 'identification',
        title: 'Identificación',
        content: 'Contenido de identificación retirado para pruebas.',
      },
    ],
    sources: [
      {
        id: 'fixture-source-2',
        title: 'Fuente documental de prueba',
        url: 'https://example.test/species/retired-wrasse',
      },
    ],
    revision: {
      id: 'fixture-revision-2',
      publishedAt: '2026-08-16T00:00:00.000Z',
    },
  },
} as const;

function adminFirestore() {
  const app =
    getApps().find((candidate) => candidate.name === 'veril-fixtures') ??
    initializeApp({ projectId }, 'veril-fixtures');
  return getFirestore(app);
}

export async function seedSpeciesProfileFixtures(): Promise<void> {
  const firestore = adminFirestore();

  await Promise.all([
    firestore
      .collection('speciesProfiles')
      .doc(speciesProfileFixtures.clownfish.id)
      .set({
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
      }),
    firestore
      .collection('speciesProfiles')
      .doc(speciesProfileFixtures.retiredWrasse.id)
      .set({
        displayName: speciesProfileFixtures.retiredWrasse.displayName,
        scientificName: speciesProfileFixtures.retiredWrasse.scientificName,
        description: speciesProfileFixtures.retiredWrasse.description,
        sections: speciesProfileFixtures.retiredWrasse.sections,
        sources: speciesProfileFixtures.retiredWrasse.sources,
        revision: {
          id: speciesProfileFixtures.retiredWrasse.revision.id,
          publishedAt: new Date(
            speciesProfileFixtures.retiredWrasse.revision.publishedAt,
          ),
        },
        status: 'retired',
      }),
  ]);
}
