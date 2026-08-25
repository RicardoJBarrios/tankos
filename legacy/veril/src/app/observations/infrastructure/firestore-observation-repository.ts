import { Injectable } from '@angular/core';
import {
  Timestamp,
  collection,
  doc,
  documentId,
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
  ObservationCursor,
  ObservationListItem,
  ObservationPage,
  ObservationReader,
  TimelineObservationReader,
  ObservationWriter,
  RecordObservationInput,
} from '../application/ports';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { pageSizeFor } from '../../shared/application/pagination';
import { DEFAULT_PAGE_SIZE } from '../../shared/application/pagination';
import { readFirestorePage } from '../../shared/infrastructure/firestore-page';
import {
  getFirestoreReadClient,
  isFirestoreTimestamp,
} from '../../shared/infrastructure/firestore-read-client';

const observationDocument = z.object({
  aquariumId: z.string().min(1),
  ownerId: z.string().min(1),
  content: z.string().min(1),
  recordedAt: z.custom<Timestamp>(isFirestoreTimestamp),
});

const observationCursor = z.object({
  recordedAt: z.string(),
  observationId: z.string(),
});

export const OBSERVATION_LIST_LIMIT = DEFAULT_PAGE_SIZE;

function encodeCursor(item: ObservationListItem): ObservationCursor {
  return encodeURIComponent(
    JSON.stringify({
      recordedAt: item.recordedAt.toISOString(),
      observationId: item.id,
    }),
  ) as ObservationCursor;
}

function decodeCursor(cursor: ObservationCursor) {
  const parsed = observationCursor.parse(
    JSON.parse(decodeURIComponent(cursor)),
  );
  const recordedAt = new Date(parsed.recordedAt);
  if (Number.isNaN(recordedAt.getTime())) {
    throw new Error('Observation cursor contains an invalid date');
  }
  return { recordedAt, observationId: parsed.observationId };
}

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
    cursor?: ObservationCursor,
    requestedPageSize?: number,
  ): Promise<ObservationPage> {
    const { firestore } = getFirebaseClient();
    const observations = collection(firestore, 'observations');
    return readFirestorePage({
      baseQuery: query(
        observations,
        where('ownerId', '==', ownerKeeperId),
        where('aquariumId', '==', aquariumId),
        orderBy('recordedAt', 'desc'),
        orderBy(documentId(), 'asc'),
      ),
      request:
        cursor || requestedPageSize
          ? { ...(cursor ? { cursor } : {}), pageSize: requestedPageSize }
          : undefined,
      decodeCursor: (value) => {
        const decoded = decodeCursor(value as ObservationCursor);
        return [decoded.recordedAt, decoded.observationId];
      },
      encodeCursor,
      map: (entry) =>
        toListItem(entry.id, observationDocument.parse(entry.data())),
    });
  }

  async listRecentOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    limitCount: number,
  ): Promise<readonly ObservationListItem[]> {
    const { firestore, module } = getFirestoreReadClient();
    const recentQuery = module.query(
      module.collection(firestore, 'observations'),
      module.where('ownerId', '==', ownerKeeperId),
      module.where('aquariumId', '==', aquariumId),
      module.orderBy('recordedAt', 'desc'),
      module.orderBy(module.documentId(), 'asc'),
      module.limit(pageSizeFor({ pageSize: limitCount })),
    );
    const snapshot = await module.getDocs(recentQuery);

    return snapshot.docs.map((entry) =>
      toListItem(entry.id, observationDocument.parse(entry.data())),
    );
  }
}
