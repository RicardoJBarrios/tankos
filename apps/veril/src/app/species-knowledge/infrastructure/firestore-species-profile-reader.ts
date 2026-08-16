import { Injectable } from '@angular/core';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { z } from 'zod';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { speciesProfileIdFrom } from '../domain/species-profile';
import { PublishedSpeciesProfileReader } from '../application/ports';

const speciesProfileDocument = z.object({
  displayName: z.string().min(1),
  scientificName: z.string().optional(),
  status: z.enum(['published', 'retired']),
});

@Injectable()
export class FirestoreSpeciesProfileReader implements PublishedSpeciesProfileReader {
  async listPublished() {
    const { firestore } = getFirebaseClient();
    const snapshot = await getDocs(
      query(
        collection(firestore, 'speciesProfiles'),
        where('status', '==', 'published'),
        orderBy('displayName', 'asc'),
      ),
    );
    return snapshot.docs.map((entry) => {
      const dto = speciesProfileDocument.parse(entry.data());
      return {
        id: speciesProfileIdFrom(entry.id),
        displayName: dto.displayName,
        ...(dto.scientificName ? { scientificName: dto.scientificName } : {}),
        status: dto.status,
      };
    });
  }
}
