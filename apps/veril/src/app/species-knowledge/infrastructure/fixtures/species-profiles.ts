import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = 'demo-veril';

export const speciesProfileFixtures = {
  clownfish: {
    id: '123e4567-e89b-42d3-a456-426614174100',
    displayName: 'Pez payaso',
    scientificName: 'Amphiprion ocellaris',
  },
  retiredWrasse: {
    id: '123e4567-e89b-42d3-a456-426614174101',
    displayName: 'Lábrido retirado',
    scientificName: 'Halichoeres ficticius',
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
        status: 'published',
      }),
    firestore
      .collection('speciesProfiles')
      .doc(speciesProfileFixtures.retiredWrasse.id)
      .set({
        displayName: speciesProfileFixtures.retiredWrasse.displayName,
        scientificName: speciesProfileFixtures.retiredWrasse.scientificName,
        status: 'retired',
      }),
  ]);
}
