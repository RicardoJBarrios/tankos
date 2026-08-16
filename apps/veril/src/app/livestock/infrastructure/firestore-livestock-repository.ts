import { Injectable } from '@angular/core';
import {
  Timestamp,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
} from 'firebase/firestore';
import { z } from 'zod';
import {
  AquariumId,
  aquariumIdFrom,
} from '../../shared/domain/aquarium-reference';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { pageSizeFor } from '../../shared/application/pagination';
import { SpeciesProfileId } from '../domain/livestock';
import {
  Livestock,
  livestockIdFrom,
  transferLivestock,
  removeLivestock,
  restoreLivestock,
} from '../domain/livestock';
import {
  LivestockAquariumReader,
  LivestockListItem,
  LivestockReader,
  LivestockWriter,
  CreateLivestockInput,
} from '../application/ports';

const associationDocument = z.object({
  aquariumId: z.string().min(1),
  associatedAt: z.instanceof(Timestamp),
  endedAt: z.instanceof(Timestamp).optional(),
});
const livestockDocument = z.object({
  aquariumId: z.string().min(1),
  ownerId: z.string().min(1),
  speciesProfileId: z.string().min(1),
  category: z.enum(['fish', 'coral', 'other']),
  representation: z.enum(['individual', 'group']),
  displayName: z.string().min(1),
  lifecycle: z.enum(['active', 'removed']),
  associatedAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
  associationHistory: z.array(associationDocument).min(1),
});

function toDto(input: CreateLivestockInput | Livestock, ownerId: string) {
  return livestockDocument.parse({
    ...input,
    ownerId,
    lifecycle: 'lifecycle' in input ? input.lifecycle : 'active',
    associatedAt: Timestamp.fromDate(input.associatedAt),
    updatedAt: Timestamp.fromDate(input.updatedAt),
    associationHistory: input.associationHistory.map((entry) => ({
      aquariumId: entry.aquariumId,
      associatedAt: Timestamp.fromDate(entry.associatedAt),
      ...(entry.endedAt ? { endedAt: Timestamp.fromDate(entry.endedAt) } : {}),
    })),
  });
}

function fromDto(
  id: string,
  dto: z.infer<typeof livestockDocument>,
): Livestock {
  return restoreLivestock({
    id: livestockIdFrom(id),
    aquariumId: aquariumIdFrom(dto.aquariumId),
    speciesProfileId: dto.speciesProfileId as SpeciesProfileId,
    category: dto.category,
    representation: dto.representation,
    displayName: dto.displayName,
    lifecycle: dto.lifecycle,
    associatedAt: dto.associatedAt.toDate(),
    updatedAt: dto.updatedAt.toDate(),
    associationHistory: dto.associationHistory.map((entry) => ({
      aquariumId: aquariumIdFrom(entry.aquariumId),
      associatedAt: entry.associatedAt.toDate(),
      ...(entry.endedAt ? { endedAt: entry.endedAt.toDate() } : {}),
    })),
  });
}

@Injectable()
export class FirestoreLivestockRepository
  implements LivestockWriter, LivestockReader, LivestockAquariumReader
{
  async create(input: CreateLivestockInput): Promise<Livestock> {
    const { firestore } = getFirebaseClient();
    const reference = doc(firestore, 'livestock', input.id);
    await setDoc(reference, toDto(input, input.ownerKeeperId));
    return fromDto(
      reference.id,
      livestockDocument.parse(
        await getDoc(reference).then((snapshot) => snapshot.data()),
      ),
    );
  }

  async getOwned(
    ownerKeeperId: string,
    id: string,
  ): Promise<LivestockListItem | null> {
    const { firestore } = getFirebaseClient();
    const snapshot = await getDoc(doc(firestore, 'livestock', id));
    if (!snapshot.exists()) return null;
    const dto = livestockDocument.parse(snapshot.data());
    if (dto.ownerId !== ownerKeeperId) return null;
    const livestock = fromDto(snapshot.id, dto);
    return livestock;
  }

  async listActiveOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
  ): Promise<readonly LivestockListItem[]> {
    const { firestore } = getFirebaseClient();
    const snapshot = await getDocs(
      query(
        collection(firestore, 'livestock'),
        where('ownerId', '==', ownerKeeperId),
        where('aquariumId', '==', aquariumId),
        where('lifecycle', '==', 'active'),
        orderBy('displayName', 'asc'),
        orderBy(documentId(), 'asc'),
        limit(pageSizeFor()),
      ),
    );
    const result: LivestockListItem[] = [];
    for (const entry of snapshot.docs) {
      const livestock = fromDto(
        entry.id,
        livestockDocument.parse(entry.data()),
      );
      result.push(livestock);
    }
    return result;
  }

  async owns(ownerKeeperId: string, aquariumId: AquariumId): Promise<boolean> {
    const { firestore } = getFirebaseClient();
    const snapshot = await getDoc(doc(firestore, 'aquariums', aquariumId));
    return snapshot.exists() && snapshot.data()?.['ownerId'] === ownerKeeperId;
  }

  async listAllOwned(
    ownerKeeperId: string,
  ): Promise<readonly LivestockListItem[]> {
    const { firestore } = getFirebaseClient();
    const snapshot = await getDocs(
      query(
        collection(firestore, 'livestock'),
        where('ownerId', '==', ownerKeeperId),
        orderBy('updatedAt', 'desc'),
        orderBy(documentId(), 'asc'),
        limit(pageSizeFor()),
      ),
    );
    return snapshot.docs.map((entry) =>
      fromDto(entry.id, livestockDocument.parse(entry.data())),
    );
  }

  async transfer(
    input: Parameters<LivestockWriter['transfer']>[0],
  ): Promise<Livestock> {
    const { firestore } = getFirebaseClient();
    const reference = doc(firestore, 'livestock', input.id);
    const destination = doc(firestore, 'aquariums', input.toAquariumId);
    let result!: Livestock;
    await runTransaction(firestore, async (transaction) => {
      const [livestockSnapshot, aquariumSnapshot] = await Promise.all([
        transaction.get(reference),
        transaction.get(destination),
      ]);
      if (!livestockSnapshot.exists()) throw new Error('Livestock not found');
      if (
        !aquariumSnapshot.exists() ||
        aquariumSnapshot.data()?.['ownerId'] !== input.ownerKeeperId
      )
        throw new Error('Aquarium is not owned by the keeper');
      const dto = livestockDocument.parse(livestockSnapshot.data());
      if (
        dto.ownerId !== input.ownerKeeperId ||
        dto.aquariumId !== input.fromAquariumId
      )
        throw new Error('Livestock is not owned or not in the active Aquarium');
      result = transferLivestock(
        fromDto(livestockSnapshot.id, dto),
        input.toAquariumId,
        input.updatedAt,
      );
      transaction.set(reference, toDto(result, input.ownerKeeperId));
    });
    return result;
  }

  async remove(input: Parameters<LivestockWriter['remove']>[0]): Promise<void> {
    const { firestore } = getFirebaseClient();
    const reference = doc(firestore, 'livestock', input.id);
    const snapshot = await getDoc(reference);
    if (!snapshot.exists()) throw new Error('Livestock not found');
    const dto = livestockDocument.parse(snapshot.data());
    if (
      dto.ownerId !== input.ownerKeeperId ||
      dto.aquariumId !== input.aquariumId
    )
      throw new Error('Livestock is not owned or not in the active Aquarium');
    const result = removeLivestock(fromDto(snapshot.id, dto), input.updatedAt);
    await setDoc(reference, toDto(result, input.ownerKeeperId));
  }
}
