import { Injectable } from '@angular/core';
import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import {
  canonicalUnitFor,
  createMeasurement,
  measurementIdFrom,
  Measurement,
  PARAMETER_IDS,
  UNIT_IDS,
} from '../domain/measurement';
import {
  MeasurementWriter,
  RecordMeasurementInput,
} from '../application/aquarium-ports';
import { aquariumIdFrom } from '../domain/aquarium-id';
import { getFirebaseClient } from './firebase-client';

const measurementDocument = z.object({
  aquariumId: z.string().min(1),
  ownerId: z.string().min(1),
  parameterId: z.enum(PARAMETER_IDS),
  enteredValue: z.number().finite(),
  enteredUnit: z.enum(UNIT_IDS),
  canonicalValue: z.number().finite(),
  canonicalUnit: z.enum(UNIT_IDS),
  measuredAt: z.instanceof(Timestamp),
  recordedAt: z.instanceof(Timestamp),
  provenance: z.literal('manual'),
});

function toDomain(
  id: string,
  data: z.infer<typeof measurementDocument>,
): Measurement {
  return createMeasurement({
    id: measurementIdFrom(id),
    aquariumId: aquariumIdFrom(data.aquariumId),
    parameterId: data.parameterId,
    enteredValue: data.enteredValue,
    enteredUnit: data.enteredUnit,
    canonicalValue: data.canonicalValue,
    canonicalUnit: data.canonicalUnit,
    measuredAt: data.measuredAt.toDate(),
    recordedAt: data.recordedAt.toDate(),
    provenance: data.provenance,
  });
}

@Injectable()
export class FirestoreMeasurementRepository implements MeasurementWriter {
  async record(input: RecordMeasurementInput): Promise<Measurement> {
    const { firestore } = getFirebaseClient();
    const reference = doc(firestore, 'measurements', input.id);
    const dto = measurementDocument.parse({
      aquariumId: input.aquariumId,
      ownerId: input.ownerKeeperId,
      parameterId: input.parameterId,
      enteredValue: input.enteredValue,
      enteredUnit: input.enteredUnit,
      canonicalValue: input.canonicalValue,
      canonicalUnit: input.canonicalUnit,
      measuredAt: Timestamp.fromDate(input.measuredAt),
      recordedAt: Timestamp.fromDate(input.recordedAt),
      provenance: input.provenance,
    });

    if (canonicalUnitFor(dto.parameterId) !== dto.canonicalUnit) {
      throw new Error('Measurement unit is incompatible with its Parameter');
    }

    await setDoc(reference, dto);
    return toDomain(reference.id, dto);
  }
}
