import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, UserRecord } from 'firebase-admin/auth';
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

export const editorialKeeperCredentials = {
  uid: 'editorial-keeper',
  email: 'editorial-keeper@example.test',
  password: 'editorial-keeper-password',
} as const;

function adminFirestore() {
  const app =
    getApps().find((candidate) => candidate.name === 'veril-fixtures') ??
    initializeApp({ projectId }, 'veril-fixtures');
  return getFirestore(app);
}

function adminAuth() {
  const app =
    getApps().find((candidate) => candidate.name === 'veril-fixtures') ??
    initializeApp({ projectId }, 'veril-fixtures');
  return getAuth(app);
}

export async function createEditorialKeeperToken(): Promise<string> {
  return adminAuth().createCustomToken(editorialKeeperCredentials.uid, {
    editorialAdmin: true,
  });
}

export async function seedEditorialKeeperAccount(): Promise<UserRecord> {
  const auth = adminAuth();
  let user: UserRecord;

  try {
    user = await auth.getUser(editorialKeeperCredentials.uid);
    user = await auth.updateUser(user.uid, {
      email: editorialKeeperCredentials.email,
      password: editorialKeeperCredentials.password,
      emailVerified: true,
      disabled: false,
    });
  } catch {
    user = await auth.createUser({
      uid: editorialKeeperCredentials.uid,
      email: editorialKeeperCredentials.email,
      password: editorialKeeperCredentials.password,
      emailVerified: true,
    });
  }

  await auth.setCustomUserClaims(user.uid, { editorialAdmin: true });
  return user;
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
