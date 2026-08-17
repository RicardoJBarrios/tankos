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
import { careWorkIdFrom, CareWork, createCareWork } from '../domain/care-work';
import {
  CareWorkWriter,
  CareWorkReader,
  CareWorkListItem,
  RecordCareWorkInput,
} from '../application/ports';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { pageSizeFor } from '../../shared/application/pagination';

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
    limitCount: number,
  ): Promise<readonly CareWorkListItem[]> {
    const { firestore } = getFirebaseClient();
    const careWorks = collection(firestore, 'careWorks');
    const recentQuery = query(
      careWorks,
      where('ownerId', '==', ownerKeeperId),
      where('aquariumId', '==', aquariumId),
      orderBy('performedAt', 'desc'),
      orderBy('recordedAt', 'desc'),
      orderBy(documentId(), 'asc'),
      limit(pageSizeFor({ pageSize: limitCount })),
    );
    const snapshot = await getDocs(recentQuery);

    return snapshot.docs.map((entry) => {
      const dto = careWorkDocument.parse(entry.data());
      return {
        id: careWorkIdFrom(entry.id),
        description: dto.description,
        performedAt: dto.performedAt.toDate(),
        recordedAt: dto.recordedAt.toDate(),
      };
    });
  }
}
