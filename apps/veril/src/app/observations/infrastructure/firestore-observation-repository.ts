import { Injectable } from '@angular/core';
import {
  Timestamp,
  collection,
  doc,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { z } from 'zod';
import {
  AquariumId,
  aquariumIdFrom,
} from '../../shared/domain/aquarium-reference';
import { Observation, observationIdFrom } from '../domain/observation';
import {
  ObservationListItem,
  ObservationReader,
  TimelineObservationReader,
  ObservationWriter,
  RecordObservationInput,
} from '../application/ports';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';

const observationDocument = z.object({
  aquariumId: z.string().min(1),
  ownerId: z.string().min(1),
  content: z.string().min(1),
  recordedAt: z.instanceof(Timestamp),
});

export const OBSERVATION_LIST_LIMIT = 50;

function toListItem(
  id: string,
  data: z.infer<typeof observationDocument>,
): ObservationListItem {
  return {
    id: observationIdFrom(id),
    content: data.content,
    recordedAt: data.recordedAt.toDate(),
  };
}

@Injectable()
export class FirestoreObservationRepository
  implements ObservationWriter, ObservationReader, TimelineObservationReader
{
  async record(input: RecordObservationInput): Promise<Observation> {
    const { firestore } = getFirebaseClient();
    const reference = doc(firestore, 'observations', input.id);
    const dto = observationDocument.parse({
      aquariumId: input.aquariumId,
      ownerId: input.ownerKeeperId,
      content: input.content,
      recordedAt: Timestamp.fromDate(input.recordedAt),
    });

    await setDoc(reference, dto);

    return {
      id: observationIdFrom(reference.id),
      aquariumId: aquariumIdFrom(dto.aquariumId),
      content: dto.content,
      recordedAt: dto.recordedAt.toDate(),
    };
  }

  async listOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
  ): Promise<readonly ObservationListItem[]> {
    const { firestore } = getFirebaseClient();
    const observations = collection(firestore, 'observations');
    const pageQuery = query(
      observations,
      where('ownerId', '==', ownerKeeperId),
      where('aquariumId', '==', aquariumId),
      orderBy('recordedAt', 'desc'),
      orderBy(documentId(), 'asc'),
      limit(OBSERVATION_LIST_LIMIT),
    );
    const snapshot = await getDocs(pageQuery);

    return snapshot.docs.map((entry) =>
      toListItem(entry.id, observationDocument.parse(entry.data())),
    );
  }

  async listRecentOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    limitCount: number,
  ): Promise<readonly ObservationListItem[]> {
    const { firestore } = getFirebaseClient();
    const observations = collection(firestore, 'observations');
    const recentQuery = query(
      observations,
      where('ownerId', '==', ownerKeeperId),
      where('aquariumId', '==', aquariumId),
      orderBy('recordedAt', 'desc'),
      orderBy(documentId(), 'asc'),
      limit(limitCount),
    );
    const snapshot = await getDocs(recentQuery);

    return snapshot.docs.map((entry) =>
      toListItem(entry.id, observationDocument.parse(entry.data())),
    );
  }
}
