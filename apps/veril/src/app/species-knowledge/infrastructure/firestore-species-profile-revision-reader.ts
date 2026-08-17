import { Injectable } from '@angular/core';
import { Timestamp } from 'firebase/firestore/lite';
import { z } from 'zod';
import { SpeciesProfileRevisionReader } from '../application/ports';
import { SpeciesProfileId } from '../domain/species-profile';
import { pageSizeFor } from '../../shared/application/pagination';
import {
  getFirestoreReadClient,
  isFirestoreTimestamp,
} from '../../shared/infrastructure/firestore-read-client';

const speciesProfileRevisionDocument = z.object({
  speciesProfileId: z.uuid(),
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
  status: z.literal('published'),
  revision: z.object({
    id: z.string().min(1),
    publishedAt: z.custom<Timestamp>(isFirestoreTimestamp),
  }),
});

@Injectable()
export class FirestoreSpeciesProfileRevisionReader implements SpeciesProfileRevisionReader {
  async listRevisions(id: SpeciesProfileId) {
    const { firestore, module } = getFirestoreReadClient();
    const snapshot = await module.getDocs(
      module.query(
        module.collection(firestore, 'speciesProfileRevisions'),
        module.where('speciesProfileId', '==', id),
        module.orderBy('revision.publishedAt', 'desc'),
        module.limit(pageSizeFor()),
      ),
    );
    return snapshot.docs.map((entry) => {
      const dto = speciesProfileRevisionDocument.parse(entry.data());
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
    });
  }
}
