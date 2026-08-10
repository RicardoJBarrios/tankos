import { Injectable } from '@angular/core';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { z } from 'zod';
import { AquariumId, aquariumIdFrom } from '../domain/aquarium';
import { CareWork, careWorkIdFrom, createCareWork } from '../domain/care-work';
import {
  createPlannedCareWork,
  plannedCareWorkIdFrom,
} from '../domain/planned-care-work';
import { PlannedCareWork } from '../domain/planned-care-work';
import {
  PlanCareWorkInput,
  CompletePlannedCareWorkInput,
  CancelPlannedCareWorkInput,
  PlannedCareWorkCompleter,
  PlannedCareWorkCanceller,
  PlannedCareWorkListItem,
  PlannedCareWorkReader,
  PlannedCareWorkWriter,
} from '../application/aquarium-ports';
import { getFirebaseClient } from './firebase-client';
import { careWorkDocument } from './firestore-care-work-repository';

const plannedCareWorkDocument = z.object({
  aquariumId: z.string().min(1),
  ownerId: z.string().min(1),
  description: z.string().min(1),
  plannedFor: z.instanceof(Timestamp),
  recordedAt: z.instanceof(Timestamp),
  provenance: z.literal('manual'),
});

@Injectable()
export class FirestorePlannedCareWorkRepository
  implements
    PlannedCareWorkWriter,
    PlannedCareWorkReader,
    PlannedCareWorkCompleter,
    PlannedCareWorkCanceller
{
  async recordPlanned(input: PlanCareWorkInput): Promise<PlannedCareWork> {
    const { firestore } = getFirebaseClient();
    const reference = doc(firestore, 'plannedCareWorks', input.id);
    const dto = plannedCareWorkDocument.parse({
      aquariumId: input.aquariumId,
      ownerId: input.ownerKeeperId,
      description: input.description,
      plannedFor: Timestamp.fromDate(input.plannedFor),
      recordedAt: Timestamp.fromDate(input.recordedAt),
      provenance: input.provenance,
    });

    await setDoc(reference, dto);

    return createPlannedCareWork({
      id: plannedCareWorkIdFrom(reference.id),
      aquariumId: aquariumIdFrom(dto.aquariumId),
      description: dto.description,
      plannedFor: dto.plannedFor.toDate(),
      recordedAt: dto.recordedAt.toDate(),
      provenance: dto.provenance,
    });
  }

  async listOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    limitCount: number,
  ): Promise<readonly PlannedCareWorkListItem[]> {
    const { firestore } = getFirebaseClient();
    const plannedCareWorks = collection(firestore, 'plannedCareWorks');
    const plannedQuery = query(
      plannedCareWorks,
      where('ownerId', '==', ownerKeeperId),
      where('aquariumId', '==', aquariumId),
      orderBy('plannedFor', 'asc'),
      orderBy('recordedAt', 'asc'),
      orderBy(documentId(), 'asc'),
      limit(limitCount),
    );
    const snapshot = await getDocs(plannedQuery);

    return snapshot.docs.map((entry) => {
      const dto = plannedCareWorkDocument.parse(entry.data());
      return {
        id: plannedCareWorkIdFrom(entry.id),
        description: dto.description,
        plannedFor: dto.plannedFor.toDate(),
        recordedAt: dto.recordedAt.toDate(),
      };
    });
  }

  async complete(input: CompletePlannedCareWorkInput): Promise<CareWork> {
    const { firestore } = getFirebaseClient();
    const plannedReference = doc(firestore, 'plannedCareWorks', input.id);
    const careWorkReference = doc(firestore, 'careWorks', input.id);

    const plannedSnapshot = await getDoc(plannedReference);
    if (!plannedSnapshot.exists()) {
      throw new Error('Planned Care Work not found');
    }

    const plannedDto = plannedCareWorkDocument.parse(plannedSnapshot.data());
    if (
      plannedDto.ownerId !== input.ownerKeeperId ||
      plannedDto.aquariumId !== input.aquariumId
    ) {
      throw new Error('Planned Care Work is not owned by the keeper');
    }

    const careWorkDto = careWorkDocument.parse({
      aquariumId: plannedDto.aquariumId,
      ownerId: plannedDto.ownerId,
      description: plannedDto.description,
      performedAt: Timestamp.fromDate(input.completedAt),
      recordedAt: Timestamp.fromDate(input.completedAt),
      provenance: 'manual',
    });

    const batch = writeBatch(firestore);
    batch.set(careWorkReference, careWorkDto);
    batch.delete(plannedReference);
    await batch.commit();

    return createCareWork({
      id: careWorkIdFrom(careWorkReference.id),
      aquariumId: aquariumIdFrom(careWorkDto.aquariumId),
      description: careWorkDto.description,
      performedAt: careWorkDto.performedAt.toDate(),
      recordedAt: careWorkDto.recordedAt.toDate(),
      provenance: careWorkDto.provenance,
    });
  }

  async cancel(input: CancelPlannedCareWorkInput): Promise<void> {
    const { firestore } = getFirebaseClient();
    const plannedReference = doc(firestore, 'plannedCareWorks', input.id);
    const plannedSnapshot = await getDoc(plannedReference);

    if (!plannedSnapshot.exists()) {
      throw new Error('Planned Care Work not found');
    }

    const plannedDto = plannedCareWorkDocument.parse(plannedSnapshot.data());
    if (
      plannedDto.ownerId !== input.ownerKeeperId ||
      plannedDto.aquariumId !== input.aquariumId
    ) {
      throw new Error('Planned Care Work is not owned by the keeper');
    }

    await deleteDoc(plannedReference);
  }
}
