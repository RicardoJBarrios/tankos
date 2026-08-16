import { Injectable } from '@angular/core';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { z } from 'zod';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import {
  SpeciesProfileId,
  speciesProfileIdFrom,
} from '../domain/species-profile';
import { PublishedSpeciesProfileReader } from '../application/ports';

const speciesProfileDocument = z.object({
  displayName: z.string().min(1),
  scientificName: z.string().optional(),
  description: z.string().min(1),
  sections: z
    .array(
      z.object({
        key: z.string().min(1),
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .min(1),
  sources: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        url: z.string().url(),
        publishedAt: z.instanceof(Timestamp).optional(),
      }),
    )
    .min(1),
  revision: z.object({
    id: z.string().min(1),
    publishedAt: z.instanceof(Timestamp),
  }),
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

  async getPublished(id: SpeciesProfileId) {
    const { firestore } = getFirebaseClient();
    const snapshot = await getDoc(doc(firestore, 'speciesProfiles', id));
    if (!snapshot.exists()) return null;
    const dto = speciesProfileDocument.parse(snapshot.data());
    if (dto.status !== 'published') return null;
    return {
      id,
      displayName: dto.displayName,
      ...(dto.scientificName ? { scientificName: dto.scientificName } : {}),
      status: dto.status,
      description: dto.description,
      sections: dto.sections,
      sources: dto.sources.map((source) => ({
        id: source.id,
        title: source.title,
        url: source.url,
        ...(source.publishedAt
          ? { publishedAt: source.publishedAt.toDate() }
          : {}),
      })),
      revision: {
        id: dto.revision.id,
        publishedAt: dto.revision.publishedAt.toDate(),
      },
    };
  }
}
