import { randomUUID } from 'node:crypto';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const app =
  getApps().find((candidate) => candidate.name === 'veril-livestock-e2e') ??
  initializeApp({ projectId: 'demo-veril' }, 'veril-livestock-e2e');
const auth = getAuth(app);
const firestore = getFirestore(app);
const runId = randomUUID().slice(0, 8);
const credentials = {
  email: `livestock-${runId}@example.test`,
  password: 'livestock-password',
};
const accountId = `e2e-livestock-${runId}`;
const sourceAquariumId = `123e4567-e89b-42d3-a456-42661417${runId.slice(0, 4)}`;
const destinationAquariumId = `123e4567-e89b-42d3-a456-42661418${runId.slice(0, 4)}`;
const speciesProfileId = `123e4567-e89b-42d3-a456-42661419${runId.slice(0, 4)}`;

let user;
try {
  user = await auth.getUser(accountId);
  user = await auth.updateUser(user.uid, {
    email: credentials.email,
    password: credentials.password,
    emailVerified: true,
    disabled: false,
  });
} catch {
  user = await auth.createUser({
    uid: accountId,
    ...credentials,
    emailVerified: true,
  });
}
await auth.setCustomUserClaims(user.uid, { isKeeper: true });

const now = Timestamp.fromDate(new Date('2026-08-17T10:00:00.000Z'));
const profile = {
  displayName: 'Pez payaso E2E',
  scientificName: 'Amphiprion ocellaris',
  description: 'Perfil de especie para pruebas E2E.',
  sections: [
    {
      key: 'identification',
      title: 'Identificación',
      content: 'Perfil de especie de prueba.',
    },
  ],
  sources: [
    {
      id: 'e2e-source',
      title: 'Fuente E2E',
      url: 'https://example.test/e2e-species',
    },
  ],
};

await firestore
  .collection('speciesProfiles')
  .doc(speciesProfileId)
  .set({
    ...profile,
    revision: { id: 'e2e-revision', publishedAt: now },
    status: 'published',
  });

const aquariums = [
  [sourceAquariumId, 'Livestock Aquarium A'],
  [destinationAquariumId, 'Livestock Aquarium B'],
];
for (const [id, name] of aquariums) {
  await firestore.collection('aquariums').doc(id).set({
    ownerId: user.uid,
    name,
    establishedBy: user.uid,
    establishedAt: now,
    timeZone: 'Atlantic/Canary',
  });
}

const existingLivestock = await firestore
  .collection('livestock')
  .where('ownerId', '==', user.uid)
  .get();
if (!existingLivestock.empty) {
  const cleanup = firestore.batch();
  for (const document of existingLivestock.docs) cleanup.delete(document.ref);
  await cleanup.commit();
}

console.log(
  JSON.stringify({
    credentials,
    sourceAquariumId,
    destinationAquariumId,
    speciesProfileId,
  }),
);
