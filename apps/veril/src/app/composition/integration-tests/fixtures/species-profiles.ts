import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = 'demo-veril';

export const speciesProfileFixtures = {
  clownfish: {
    id: '123e4567-e89b-42d3-a456-426614174100',
    displayName: 'Pez payaso',
    scientificName: 'Amphiprion ocellaris',
  },
} as const;

function adminFirestore() {
  const app =
    getApps().find((candidate) => candidate.name === 'veril-fixtures') ??
    initializeApp({ projectId }, 'veril-fixtures');
  return getFirestore(app);
}

export async function seedPublishedSpeciesProfiles(): Promise<void> {
  const firestore = adminFirestore();

  await Promise.all(
    Object.values(speciesProfileFixtures).map((profile) =>
      firestore.collection('speciesProfiles').doc(profile.id).set({
        displayName: profile.displayName,
        scientificName: profile.scientificName,
        status: 'published',
      }),
    ),
  );
}
