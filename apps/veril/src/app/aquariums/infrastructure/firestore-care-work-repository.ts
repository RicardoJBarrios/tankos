import { Injectable } from '@angular/core';
import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { aquariumIdFrom } from '../domain/aquarium';
import { careWorkIdFrom, CareWork, createCareWork } from '../domain/care-work';
import {
  CareWorkWriter,
  RecordCareWorkInput,
} from '../application/aquarium-ports';
import { getFirebaseClient } from './firebase-client';

const careWorkDocument = z.object({
  aquariumId: z.string().min(1),
  ownerId: z.string().min(1),
  description: z.string().min(1),
  performedAt: z.instanceof(Timestamp),
  recordedAt: z.instanceof(Timestamp),
  provenance: z.literal('manual'),
});

@Injectable()
export class FirestoreCareWorkRepository implements CareWorkWriter {
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
}
