import { Injectable } from '@angular/core';
import {
  Timestamp,
  collection,
  documentId,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { z } from 'zod';
import { Aquarium } from '../domain/aquarium';
import { aquariumIdFrom } from '../domain/aquarium-id';
import { AquariumName } from '../domain/aquarium-name';
import {
  AquariumListItem,
  AquariumReader,
  AquariumRepository,
  EstablishAquariumInput,
} from '../application/aquarium-ports';
import { getFirebaseClient } from './firebase-client';

const aquariumDocument = z.object({
  ownerId: z.string().min(1),
  name: z.string().min(1),
  establishedBy: z.string().min(1),
  establishedAt: z.instanceof(Timestamp),
});

function parseAquariumDocument(data: unknown) {
  return aquariumDocument.parse(data);
}

@Injectable()
export class FirestoreAquariumRepository
  implements AquariumRepository, AquariumReader
{
  async establish(input: EstablishAquariumInput): Promise<Aquarium> {
    const { firestore } = getFirebaseClient();
    const reference = doc(firestore, 'aquariums', input.id);
    const dto = parseAquariumDocument({
      ownerId: input.ownerKeeperId,
      name: input.name.value,
      establishedBy: input.ownerKeeperId,
      establishedAt: Timestamp.fromDate(input.establishedAt),
    });

    await setDoc(reference, dto);

    return {
      id: aquariumIdFrom(reference.id),
      name: AquariumName.create(dto.name),
      ownerKeeperId: dto.ownerId,
      establishedAt: dto.establishedAt.toDate(),
    };
  }

  async listOwned(ownerKeeperId: string): Promise<readonly AquariumListItem[]> {
    const { firestore } = getFirebaseClient();
    const snapshots = await getDocs(
      query(
        collection(firestore, 'aquariums'),
        where('ownerId', '==', ownerKeeperId),
      ),
    );

    return snapshots.docs
      .map((snapshot) => {
        const dto = parseAquariumDocument(snapshot.data());

        return {
          item: {
            id: aquariumIdFrom(snapshot.id),
            name: AquariumName.create(dto.name),
          },
          establishedAt: dto.establishedAt.toMillis(),
        };
      })
      .sort(
        (left, right) =>
          right.establishedAt - left.establishedAt ||
          left.item.id.localeCompare(right.item.id),
      )
      .map(({ item }) => item);
  }

  async getOwned(
    ownerKeeperId: string,
    aquariumId: AquariumListItem['id'],
  ): Promise<AquariumListItem | null> {
    const { firestore } = getFirebaseClient();
    const snapshots = await getDocs(
      query(
        collection(firestore, 'aquariums'),
        where('ownerId', '==', ownerKeeperId),
        where(documentId(), '==', aquariumId),
      ),
    );

    const snapshot = snapshots.docs[0];
    if (!snapshot) {
      return null;
    }

    const dto = parseAquariumDocument(snapshot.data());

    if (dto.ownerId !== ownerKeeperId) {
      throw new Error('Aquarium is not owned by the keeper');
    }

    return {
      id: aquariumIdFrom(snapshot.id),
      name: AquariumName.create(dto.name),
    };
  }
}
