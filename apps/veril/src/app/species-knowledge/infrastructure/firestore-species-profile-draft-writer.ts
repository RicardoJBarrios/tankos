import { Injectable } from '@angular/core';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';
import { SpeciesProfileDraft } from '../domain/species-profile';
import { SpeciesProfileDraftWriter } from '../application/ports';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';

const speciesProfileDraft = z.object({
  speciesProfileId: z.string().uuid(),
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
        publishedAt: z.date().optional(),
      }),
    )
    .min(1),
});

@Injectable()
export class FirestoreSpeciesProfileDraftWriter implements SpeciesProfileDraftWriter {
  async saveDraft(draft: SpeciesProfileDraft): Promise<void> {
    const validDraft = speciesProfileDraft.parse(draft);
    const { firestore } = getFirebaseClient();
    await setDoc(
      doc(firestore, 'speciesProfileDrafts', validDraft.speciesProfileId),
      {
        ...validDraft,
        status: 'draft',
        updatedAt: serverTimestamp(),
        sources: validDraft.sources.map((source) => ({
          ...source,
          ...(source.publishedAt ? { publishedAt: source.publishedAt } : {}),
        })),
      },
    );
  }
}
