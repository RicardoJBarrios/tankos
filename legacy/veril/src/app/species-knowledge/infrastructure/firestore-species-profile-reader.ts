import { Injectable } from '@angular/core';
import { Timestamp } from 'firebase/firestore/lite';
import { z } from 'zod';
import { pageSizeFor } from '../../shared/application/pagination';
import {
  SpeciesProfileId,
  speciesProfileIdFrom,
} from '../domain/species-profile';
import { PublishedSpeciesProfileReader } from '../application/ports';
import {
  getFirestoreReadClient,
  isFirestoreTimestamp,
} from '../../shared/infrastructure/firestore-read-client';

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
        url: z.url(),
        publishedAt: z.custom<Timestamp>(isFirestoreTimestamp).optional(),
      }),
    )
    .min(1),
  revision: z.object({
    id: z.string().min(1),
    publishedAt: z.custom<Timestamp>(isFirestoreTimestamp),
  }),
  status: z.enum(['published', 'retired']),
});

@Injectable()
export class FirestoreSpeciesProfileReader implements PublishedSpeciesProfileReader {
  async listPublished() {
    const { firestore, module } = getFirestoreReadClient();
    const snapshot = await module.getDocs(
      module.query(
        module.collection(firestore, 'speciesProfiles'),
        module.where('status', '==', 'published'),
        module.orderBy('displayName', 'asc'),
        module.limit(pageSizeFor()),
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
    const { firestore, module } = getFirestoreReadClient();
    const snapshot = await module.getDoc(
      module.doc(firestore, 'speciesProfiles', id),
    );
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
