import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = 'demo-veril';
const profileId = '123e4567-e89b-42d3-a456-426614174100';
const revisionId = 'fixture-revision-1';
const credentials = {
  email: 'editorial-keeper@example.test',
  password: 'editorial-keeper-password',
};
const profile = {
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
};

const app =
  getApps().find((candidate) => candidate.name === 'veril-e2e-fixtures') ??
  initializeApp({ projectId }, 'veril-e2e-fixtures');
const auth = getAuth(app);
const firestore = getFirestore(app);

let user;
try {
  user = await auth.getUserByEmail(credentials.email);
  user = await auth.updateUser(user.uid, {
    password: credentials.password,
    emailVerified: true,
    disabled: false,
  });
} catch {
  user = await auth.createUser({
    uid: 'editorial-keeper',
    ...credentials,
    emailVerified: true,
  });
}
await auth.setCustomUserClaims(user.uid, { editorialAdmin: true });

const publishedAt = new Date('2026-08-16T00:00:00.000Z');
await firestore
  .collection('speciesProfiles')
  .doc(profileId)
  .set({
    ...profile,
    revision: { id: revisionId, publishedAt },
    status: 'published',
  });
await firestore
  .collection('speciesProfileRevisions')
  .doc(`${profileId}_${revisionId}`)
  .set({
    speciesProfileId: profileId,
    ...profile,
    revision: { id: revisionId, publishedAt },
    status: 'published',
  });

console.log(JSON.stringify({ profileId, credentials }));
