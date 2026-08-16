import { Injectable } from '@angular/core';
import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { z } from 'zod';
import { SpeciesProfileDraft } from '../domain/species-profile';
import {
  SpeciesProfileDraftReader,
  SpeciesProfileDraftWriter,
  SpeciesProfilePublisher,
  SpeciesProfileReviewer,
} from '../application/ports';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { speciesProfileIdFrom } from '../domain/species-profile';

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

const persistedSpeciesProfileDraft = z.object({
  speciesProfileId: z.string().uuid(),
  displayName: z.string().min(1),
  scientificName: z.string().optional(),
  description: z.string().min(1),
  sections: speciesProfileDraft.shape.sections,
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
  status: z.enum(['draft', 'reviewed', 'published']),
  updatedAt: z.instanceof(Timestamp).optional(),
});

@Injectable()
export class FirestoreSpeciesProfileDraftWriter
  implements
    SpeciesProfileDraftWriter,
    SpeciesProfileDraftReader,
    SpeciesProfilePublisher,
    SpeciesProfileReviewer
{
  async saveDraft(draft: Omit<SpeciesProfileDraft, 'status'>): Promise<void> {
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

  async getDraft(id: ReturnType<typeof speciesProfileIdFrom>) {
    const { firestore } = getFirebaseClient();
    const snapshot = await getDoc(doc(firestore, 'speciesProfileDrafts', id));
    if (!snapshot.exists()) return null;
    const persisted = persistedSpeciesProfileDraft.parse(snapshot.data());
    if (persisted.status === 'published') return null;
    return {
      speciesProfileId: speciesProfileIdFrom(persisted.speciesProfileId),
      status: persisted.status,
      displayName: persisted.displayName,
      ...(persisted.scientificName
        ? { scientificName: persisted.scientificName }
        : {}),
      description: persisted.description,
      sections: persisted.sections,
      sources: persisted.sources.map(({ publishedAt, ...source }) => ({
        ...source,
        ...(publishedAt ? { publishedAt: publishedAt.toDate() } : {}),
      })),
    };
  }

  async reviewDraft(
    id: ReturnType<typeof speciesProfileIdFrom>,
  ): Promise<void> {
    const { firestore } = getFirebaseClient();
    const draftRef = doc(firestore, 'speciesProfileDrafts', id);
    const snapshot = await getDoc(draftRef);
    if (!snapshot.exists()) throw new Error('Species Profile draft not found');
    const persisted = persistedSpeciesProfileDraft.parse(snapshot.data());
    if (persisted.status !== 'draft') {
      throw new Error('Only a draft can be reviewed');
    }
    await setDoc(
      draftRef,
      { status: 'reviewed', updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  async publishDraft(
    draft: Parameters<SpeciesProfilePublisher['publishDraft']>[0],
    revisionId: string,
    publishedAt: Date,
  ): Promise<void> {
    const validDraft = speciesProfileDraft.parse(draft);
    const { firestore } = getFirebaseClient();
    const draftSnapshot = await getDoc(
      doc(firestore, 'speciesProfileDrafts', validDraft.speciesProfileId),
    );
    if (!draftSnapshot.exists())
      throw new Error('Species Profile draft not found');
    const persistedDraft = persistedSpeciesProfileDraft.parse(
      draftSnapshot.data(),
    );
    if (persistedDraft.status !== 'reviewed') {
      throw new Error('Only a reviewed draft can be published');
    }
    const batch = writeBatch(firestore);
    const profileRef = doc(
      firestore,
      'speciesProfiles',
      validDraft.speciesProfileId,
    );
    const revisionRef = doc(
      firestore,
      'speciesProfileRevisions',
      `${validDraft.speciesProfileId}_${revisionId}`,
    );
    const content = {
      displayName: validDraft.displayName,
      ...(validDraft.scientificName
        ? { scientificName: validDraft.scientificName }
        : {}),
      description: validDraft.description,
      sections: validDraft.sections,
      sources: validDraft.sources,
      status: 'published' as const,
      revision: { id: revisionId, publishedAt },
    };
    batch.set(revisionRef, {
      speciesProfileId: validDraft.speciesProfileId,
      ...content,
    });
    batch.set(profileRef, content);
    batch.set(
      doc(firestore, 'speciesProfileDrafts', validDraft.speciesProfileId),
      { status: 'published', publishedAt, updatedAt: serverTimestamp() },
      { merge: true },
    );
    await batch.commit();
  }
}
