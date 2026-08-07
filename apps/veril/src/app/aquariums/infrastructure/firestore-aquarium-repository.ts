import { Injectable } from '@angular/core';
import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { Aquarium } from '../domain/aquarium';
import { aquariumIdFrom } from '../domain/aquarium-id';
import { AquariumName } from '../domain/aquarium-name';
import {
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

@Injectable()
export class FirestoreAquariumRepository implements AquariumRepository {
  async establish(input: EstablishAquariumInput): Promise<Aquarium> {
    const { firestore } = getFirebaseClient();
    const reference = doc(firestore, 'aquariums', input.id);
    const dto = aquariumDocument.parse({
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
}
