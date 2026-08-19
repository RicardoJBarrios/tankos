import {
  Timestamp,
  collection,
  documentId,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { z } from 'zod';
import {
  SharedMeasurementHistoryCursor,
  SharedMeasurementHistoryFilter,
  SharedMeasurementHistoryPage,
  SharedMeasurementHistoryReader,
} from '../../shared-access/application/measurement-history-ports';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { readFirestorePage } from '../../shared/infrastructure/firestore-page';
import { isFirestoreTimestamp } from '../../shared/infrastructure/firestore-read-client';

const sharedMeasurementDocument = z.object({
  parameterId: z.enum([
    'temperature',
    'salinity',
    'alkalinity',
    'nitrate',
    'phosphate',
  ]),
  canonicalValue: z.number(),
  canonicalUnit: z.enum([
    'celsius',
    'parts-per-thousand',
    'degrees-kh',
    'milligrams-per-litre-as-no3',
    'milligrams-per-litre-as-po4',
  ]),
  measuredAt: z.custom<Timestamp>(isFirestoreTimestamp),
  recordedAt: z.custom<Timestamp>(isFirestoreTimestamp),
  correctsMeasurementId: z.string().uuid().optional(),
});

export class FirestoreSharedMeasurementHistoryReader implements SharedMeasurementHistoryReader {
  async list(
    aquariumId: string,
    filter: SharedMeasurementHistoryFilter,
    cursor?: SharedMeasurementHistoryCursor,
    pageSize?: number,
  ): Promise<SharedMeasurementHistoryPage> {
    const cursorSchema = z.object({
      measuredAt: z.string(),
      recordedAt: z.string(),
      measurementId: z.string(),
      parameterId: z.string(),
    });
    const encodeCursor = (
      item: SharedMeasurementHistoryPage['items'][number],
    ) =>
      encodeURIComponent(
        JSON.stringify({
          measuredAt: item.measuredAt.toISOString(),
          recordedAt: item.recordedAt.toISOString(),
          measurementId: item.id,
          parameterId: filter.parameterId,
        }),
      ) as SharedMeasurementHistoryCursor;
    const decodeCursor = (value: SharedMeasurementHistoryCursor) => {
      const parsed = cursorSchema.parse(JSON.parse(decodeURIComponent(value)));
      if (parsed.parameterId !== filter.parameterId) {
        throw new Error('Shared measurement cursor does not match its filter');
      }
      return [
        Timestamp.fromDate(new Date(parsed.measuredAt)),
        Timestamp.fromDate(new Date(parsed.recordedAt)),
        parsed.measurementId,
      ] as const;
    };
    const { firestore } = getFirebaseClient();
    const page = await readFirestorePage<
      SharedMeasurementHistoryPage['items'][number],
      SharedMeasurementHistoryCursor
    >({
      baseQuery: query(
        collection(firestore, 'measurements'),
        where('aquariumId', '==', aquariumId),
        where('parameterId', '==', filter.parameterId),
        orderBy('measuredAt', 'desc'),
        orderBy('recordedAt', 'desc'),
        orderBy(documentId(), 'asc'),
      ),
      request:
        cursor || pageSize
          ? { ...(cursor ? { cursor } : {}), pageSize }
          : undefined,
      decodeCursor: (value) =>
        decodeCursor(value as SharedMeasurementHistoryCursor),
      encodeCursor,
      map: (entry) => {
        const data = sharedMeasurementDocument.parse(entry.data());
        return {
          id: entry.id,
          parameterId: data.parameterId,
          canonicalValue: data.canonicalValue,
          canonicalUnit: data.canonicalUnit,
          measuredAt: data.measuredAt.toDate(),
          recordedAt: data.recordedAt.toDate(),
          ...(data.correctsMeasurementId
            ? { correctsMeasurementId: data.correctsMeasurementId }
            : {}),
        };
      },
    });
    return {
      items: page.items,
      ...(page.nextCursor
        ? { nextCursor: page.nextCursor as SharedMeasurementHistoryCursor }
        : {}),
    };
  }
}
