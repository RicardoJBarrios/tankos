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
import { careWorkIdFrom, CareWork, createCareWork } from '../domain/care-work';
import {
  CareWorkWriter,
  CareWorkReader,
  CareWorkListItem,
  CareWorkCursor,
  CareWorkPage,
  RecordCareWorkInput,
} from '../application/ports';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { readFirestorePage } from '../../shared/infrastructure/firestore-page';

const careWorkCursor = z.object({
  performedAt: z.string(),
  recordedAt: z.string(),
  careWorkId: z.string(),
});

function encodeCursor(item: CareWorkListItem): CareWorkCursor {
  return encodeURIComponent(
    JSON.stringify({
      performedAt: item.performedAt.toISOString(),
      recordedAt: item.recordedAt.toISOString(),
      careWorkId: item.id,
    }),
  ) as CareWorkCursor;
}

function decodeCursor(cursor: CareWorkCursor) {
  const value = careWorkCursor.parse(JSON.parse(decodeURIComponent(cursor)));
  const performedAt = new Date(value.performedAt);
  const recordedAt = new Date(value.recordedAt);
  if (
    Number.isNaN(performedAt.getTime()) ||
    Number.isNaN(recordedAt.getTime())
  ) {
    throw new Error('Care work cursor contains invalid dates');
  }
  return { performedAt, recordedAt, careWorkId: value.careWorkId };
}

export const careWorkDocument = z.object({
  aquariumId: z.string().min(1),
  ownerId: z.string().min(1),
  description: z.string().min(1),
  performedAt: z.instanceof(Timestamp),
  recordedAt: z.instanceof(Timestamp),
  provenance: z.literal('manual'),
});

@Injectable()
export class FirestoreCareWorkRepository
  implements CareWorkWriter, CareWorkReader
{
  async record(input: RecordCareWorkInput): Promise<CareWork> {
    const { firestore } = getFirebaseClient();
    const reference = doc(firestore, 'careWorks', input.id);
    const dto = careWorkDocument.parse({
      aquariumId: input.aquariumId,
      ownerId: input.ownerKeeperId,
      description: input.description,
      performedAt: Timestamp.fromDate(input.performedAt),
      recordedAt: Timestamp.fromDate(input.recordedAt),
      provenance: input.provenance,
    });

    await setDoc(reference, dto);

    return createCareWork({
      id: careWorkIdFrom(reference.id),
      aquariumId: aquariumIdFrom(dto.aquariumId),
      description: dto.description,
      performedAt: dto.performedAt.toDate(),
      recordedAt: dto.recordedAt.toDate(),
      provenance: dto.provenance,
    });
  }

  async listRecentOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    cursor?: CareWorkCursor,
    requestedPageSize?: number,
  ): Promise<CareWorkPage> {
    const { firestore } = getFirebaseClient();
    const careWorks = collection(firestore, 'careWorks');
    return readFirestorePage({
      baseQuery: query(
        careWorks,
        where('ownerId', '==', ownerKeeperId),
        where('aquariumId', '==', aquariumId),
        orderBy('performedAt', 'desc'),
        orderBy('recordedAt', 'desc'),
        orderBy(documentId(), 'asc'),
      ),
      request:
        cursor || requestedPageSize
          ? { ...(cursor ? { cursor } : {}), pageSize: requestedPageSize }
          : undefined,
      decodeCursor: (value) => {
        const decoded = decodeCursor(value as CareWorkCursor);
        return [decoded.performedAt, decoded.recordedAt, decoded.careWorkId];
      },
      encodeCursor,
      map: (entry) => {
        const dto = careWorkDocument.parse(entry.data());
        return {
          id: careWorkIdFrom(entry.id),
          description: dto.description,
          performedAt: dto.performedAt.toDate(),
          recordedAt: dto.recordedAt.toDate(),
        };
      },
    });
  }
}
