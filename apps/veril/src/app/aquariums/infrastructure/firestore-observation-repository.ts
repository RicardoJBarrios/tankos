import { Injectable } from '@angular/core';
import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { aquariumIdFrom } from '../domain/aquarium-id';
import { Observation, observationIdFrom } from '../domain/observation';
import {
  ObservationWriter,
  RecordObservationInput,
} from '../application/aquarium-ports';
import { getFirebaseClient } from './firebase-client';

const observationDocument = z.object({
  aquariumId: z.string().min(1),
  ownerId: z.string().min(1),
  content: z.string().min(1),
  recordedAt: z.instanceof(Timestamp),
});

@Injectable()
export class FirestoreObservationRepository implements ObservationWriter {
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
}
