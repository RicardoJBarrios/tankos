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
  canonicalUnitFor,
  createMeasurement,
  measurementIdFrom,
  Measurement,
  ParameterId,
  PARAMETER_IDS,
  UNIT_IDS,
} from '../domain/measurement';
import {
  MeasurementWriter,
  MeasurementCursor,
  CurrentMeasurementReader,
  MeasurementListItem,
  MeasurementPage,
  MeasurementReader,
  TimelineMeasurementReader,
  RecordMeasurementInput,
} from '../application/ports';
import {
  AquariumId,
  aquariumIdFrom,
} from '../../shared/domain/aquarium-reference';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { readFirestorePage } from '../../shared/infrastructure/firestore-page';
import { pageSizeFor } from '../../shared/application/pagination';
import { DEFAULT_PAGE_SIZE } from '../../shared/application/pagination';

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

const measurementCursor = z.object({
  measuredAt: z.string(),
  recordedAt: z.string(),
  measurementId: z.string(),
});

export const MEASUREMENT_PAGE_SIZE = DEFAULT_PAGE_SIZE;

function encodeCursor(item: MeasurementListItem): MeasurementCursor {
  return encodeURIComponent(
    JSON.stringify({
      measuredAt: item.measuredAt.toISOString(),
      recordedAt: item.recordedAt.toISOString(),
      measurementId: item.id,
    }),
  ) as MeasurementCursor;
}

function decodeCursor(cursor: MeasurementCursor) {
  const parsed = measurementCursor.parse(
    JSON.parse(decodeURIComponent(cursor)),
  );
  const measuredAt = new Date(parsed.measuredAt);
  const recordedAt = new Date(parsed.recordedAt);

  if (
    Number.isNaN(measuredAt.getTime()) ||
    Number.isNaN(recordedAt.getTime())
  ) {
    throw new Error('Measurement cursor contains invalid dates');
  }

  return {
    measuredAt,
    recordedAt,
    measurementId: measurementIdFrom(parsed.measurementId),
  };
}

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

function toListItem(
  id: string,
  data: z.infer<typeof measurementDocument>,
): MeasurementListItem {
  const measurement = toDomain(id, data);

  return {
    id: measurement.id,
    parameterId: measurement.parameterId,
    canonicalValue: measurement.canonicalValue,
    canonicalUnit: measurement.canonicalUnit,
    measuredAt: measurement.measuredAt,
    recordedAt: measurement.recordedAt,
    provenance: measurement.provenance,
  };
}

@Injectable()
export class FirestoreMeasurementRepository
  implements
    MeasurementWriter,
    MeasurementReader,
    CurrentMeasurementReader,
    TimelineMeasurementReader
{
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

  async listOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    cursor?: MeasurementCursor,
  ): Promise<MeasurementPage> {
    const { firestore } = getFirebaseClient();
    const measurements = collection(firestore, 'measurements');
    return readFirestorePage({
      baseQuery: query(
        measurements,
        where('ownerId', '==', ownerKeeperId),
        where('aquariumId', '==', aquariumId),
        orderBy('measuredAt', 'desc'),
        orderBy('recordedAt', 'desc'),
        orderBy(documentId(), 'asc'),
      ),
      request: cursor ? { cursor, pageSize: MEASUREMENT_PAGE_SIZE } : undefined,
      decodeCursor: (value) => {
        const decoded = decodeCursor(value as MeasurementCursor);
        return [
          Timestamp.fromDate(decoded.measuredAt),
          Timestamp.fromDate(decoded.recordedAt),
          decoded.measurementId,
        ];
      },
      encodeCursor,
      map: (entry) =>
        toListItem(entry.id, measurementDocument.parse(entry.data())),
    });
  }

  async listRecentOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    limitCount: number,
  ): Promise<readonly MeasurementListItem[]> {
    const { firestore } = getFirebaseClient();
    const measurements = collection(firestore, 'measurements');
    const recentQuery = query(
      measurements,
      where('ownerId', '==', ownerKeeperId),
      where('aquariumId', '==', aquariumId),
      orderBy('measuredAt', 'desc'),
      orderBy('recordedAt', 'desc'),
      orderBy(documentId(), 'asc'),
      limit(pageSizeFor({ pageSize: limitCount })),
    );
    const snapshot = await getDocs(recentQuery);

    return snapshot.docs.map((entry) =>
      toListItem(entry.id, measurementDocument.parse(entry.data())),
    );
  }

  async findCurrentOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    parameterId: ParameterId,
  ): Promise<MeasurementListItem | null> {
    const { firestore } = getFirebaseClient();
    const snapshot = await getDocs(
      query(
        collection(firestore, 'measurements'),
        where('ownerId', '==', ownerKeeperId),
        where('aquariumId', '==', aquariumId),
        where('parameterId', '==', parameterId),
        orderBy('measuredAt', 'desc'),
        orderBy('recordedAt', 'desc'),
        orderBy(documentId(), 'asc'),
        limit(1),
      ),
    );
    const entry = snapshot.docs[0];

    return entry
      ? toListItem(entry.id, measurementDocument.parse(entry.data()))
      : null;
  }
}
