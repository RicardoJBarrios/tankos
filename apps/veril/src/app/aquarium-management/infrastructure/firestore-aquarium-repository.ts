import { Injectable } from '@angular/core';
import {
  Timestamp,
  collection,
  deleteField,
  documentId,
  doc,
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
  Aquarium,
  AquariumLocation,
  ParameterTarget,
} from '../domain/aquarium';
import {
  AquariumTimeZone,
  AquariumName,
  AquariumLocation as AquariumLocationValue,
  ParameterTargets,
  aquariumIdFrom,
  aquariumTimeZoneFrom,
  parameterTargetsFrom,
} from '../domain/aquarium';
import {
  AquariumListItem,
  AquariumCursor,
  AquariumPage,
  AquariumReader,
  AquariumRepository,
  AquariumTimeZoneConfigurer,
  ConfigureAquariumTimeZoneInput,
  AquariumLocationConfigurer,
  ConfigureAquariumLocationInput,
  EstablishAquariumInput,
  AquariumDashboardContext,
  AquariumDashboardReader,
  ParameterTargetWriter,
  RemoveParameterTargetInput,
  SaveParameterTargetInput,
} from '../application/ports';
import { PARAMETER_IDS } from '../../shared/domain/parameter-reference';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { readFirestorePage } from '../../shared/infrastructure/firestore-page';

const aquariumCursor = z.object({
  establishedAt: z.string(),
  aquariumId: z.string(),
});

function encodeAquariumCursor(item: AquariumListItem): AquariumCursor {
  if (!item.establishedAt)
    throw new Error('Aquarium cursor metadata is missing');
  return encodeURIComponent(
    JSON.stringify({
      establishedAt: item.establishedAt.toISOString(),
      aquariumId: item.id,
    }),
  ) as AquariumCursor;
}

function decodeAquariumCursor(cursor: AquariumCursor) {
  const value = aquariumCursor.parse(JSON.parse(decodeURIComponent(cursor)));
  const establishedAt = new Date(value.establishedAt);
  if (Number.isNaN(establishedAt.getTime())) {
    throw new Error('Aquarium cursor contains an invalid date');
  }
  return { establishedAt, aquariumId: value.aquariumId };
}

const parameterTargetDocument = z
  .object({
    minimum: z.number().nonnegative(),
    maximum: z.number().nonnegative(),
  })
  .strict()
  .refine(({ minimum, maximum }) => minimum <= maximum, {
    message: 'Parameter target minimum must not exceed maximum',
  });

export const aquariumDocument = z.object({
  ownerId: z.string().min(1),
  name: z.string().min(1),
  establishedBy: z.string().min(1),
  establishedAt: z.instanceof(Timestamp),
  timeZone: z.string().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      displayName: z.string().min(1),
    })
    .optional(),
  parameterTargets: z
    .object({
      temperature: parameterTargetDocument.optional(),
      salinity: parameterTargetDocument.optional(),
      alkalinity: parameterTargetDocument.optional(),
      nitrate: parameterTargetDocument.optional(),
      phosphate: parameterTargetDocument.optional(),
    })
    .strict()
    .optional(),
});

function parseAquariumDocument(data: unknown) {
  return aquariumDocument.parse(data);
}

function parameterTargetsFromDocument(
  parameterTargets: z.infer<typeof aquariumDocument>['parameterTargets'],
): ParameterTargets {
  if (!parameterTargets) {
    return {};
  }

  return parameterTargetsFrom(
    PARAMETER_IDS.flatMap((parameterId) => {
      const target = parameterTargets[parameterId];
      return target
        ? [
            ParameterTarget.create({
              parameterId,
              minimum: target.minimum,
              maximum: target.maximum,
            }),
          ]
        : [];
    }),
  );
}

function parameterTargetsDocument(
  parameterTargets: ParameterTargets,
): Record<string, { readonly minimum: number; readonly maximum: number }> {
  return Object.fromEntries(
    PARAMETER_IDS.flatMap((parameterId) => {
      const target = parameterTargets[parameterId];
      return target
        ? [[parameterId, { minimum: target.minimum, maximum: target.maximum }]]
        : [];
    }),
  );
}

@Injectable()
export class FirestoreAquariumRepository
  implements
    AquariumRepository,
    AquariumReader,
    AquariumTimeZoneConfigurer,
    AquariumLocationConfigurer,
    AquariumDashboardReader,
    ParameterTargetWriter
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
      ...(dto.timeZone ? { timeZone: aquariumTimeZoneFrom(dto.timeZone) } : {}),
      ...(dto.location
        ? { location: AquariumLocationValue.create(dto.location) }
        : {}),
    };
  }

  async configureLocation(
    input: ConfigureAquariumLocationInput,
  ): Promise<AquariumLocation> {
    const { firestore } = getFirebaseClient();
    const location = AquariumLocationValue.create(input.location);
    const reference = doc(firestore, 'aquariums', input.aquariumId);

    await runTransaction(firestore, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) {
        throw new Error('Aquarium not found');
      }

      const dto = parseAquariumDocument(snapshot.data());
      if (dto.ownerId !== input.ownerKeeperId) {
        throw new Error('Aquarium is not owned by the keeper');
      }
      if (dto.location) {
        throw new Error('Aquarium location is already configured');
      }

      transaction.update(reference, { location });
    });

    return location;
  }

  async configure(
    input: ConfigureAquariumTimeZoneInput,
  ): Promise<AquariumTimeZone> {
    const { firestore } = getFirebaseClient();
    const timeZone = aquariumTimeZoneFrom(input.timeZone);
    const reference = doc(firestore, 'aquariums', input.aquariumId);

    await runTransaction(firestore, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) {
        throw new Error('Aquarium not found');
      }

      const dto = parseAquariumDocument(snapshot.data());
      if (dto.ownerId !== input.ownerKeeperId) {
        throw new Error('Aquarium is not owned by the keeper');
      }
      if (dto.timeZone) {
        throw new Error('Aquarium time zone is already configured');
      }

      transaction.update(reference, { timeZone });
    });

    return timeZone;
  }

  async saveOwned(input: SaveParameterTargetInput): Promise<ParameterTarget> {
    const { firestore } = getFirebaseClient();
    const target = ParameterTarget.create(input.target);
    const reference = doc(firestore, 'aquariums', input.aquariumId);

    await runTransaction(firestore, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) {
        throw new Error('Aquarium not found');
      }

      const dto = parseAquariumDocument(snapshot.data());
      if (dto.ownerId !== input.ownerKeeperId) {
        throw new Error('Aquarium is not owned by the keeper');
      }

      const parameterTargets = parameterTargetsFromDocument(
        dto.parameterTargets,
      );
      transaction.update(reference, {
        parameterTargets: parameterTargetsDocument({
          ...parameterTargets,
          [target.parameterId]: target,
        }),
      });
    });

    return target;
  }

  async removeOwned(input: RemoveParameterTargetInput): Promise<void> {
    const { firestore } = getFirebaseClient();
    const reference = doc(firestore, 'aquariums', input.aquariumId);

    await runTransaction(firestore, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) {
        throw new Error('Aquarium not found');
      }

      const dto = parseAquariumDocument(snapshot.data());
      if (dto.ownerId !== input.ownerKeeperId) {
        throw new Error('Aquarium is not owned by the keeper');
      }

      const parameterTargets = parameterTargetsFromDocument(
        dto.parameterTargets,
      );
      if (!parameterTargets[input.parameterId]) {
        return;
      }

      const remaining = { ...parameterTargets };
      delete remaining[input.parameterId];
      transaction.update(reference, {
        parameterTargets: Object.keys(remaining).length
          ? parameterTargetsDocument(remaining)
          : deleteField(),
      });
    });
  }

  async listOwned(
    ownerKeeperId: string,
    cursor?: AquariumCursor,
    requestedPageSize?: number,
  ): Promise<AquariumPage> {
    const { firestore } = getFirebaseClient();
    return readFirestorePage({
      baseQuery: query(
        collection(firestore, 'aquariums'),
        where('ownerId', '==', ownerKeeperId),
        orderBy('establishedAt', 'desc'),
        orderBy(documentId(), 'asc'),
      ),
      request:
        cursor || requestedPageSize
          ? {
              ...(cursor ? { cursor } : {}),
              pageSize: requestedPageSize,
            }
          : undefined,
      decodeCursor: (value) => {
        const decoded = decodeAquariumCursor(value as AquariumCursor);
        return [Timestamp.fromDate(decoded.establishedAt), decoded.aquariumId];
      },
      encodeCursor: encodeAquariumCursor,
      map: (snapshot) => {
        const dto = parseAquariumDocument(snapshot.data());

        return {
          id: aquariumIdFrom(snapshot.id),
          name: AquariumName.create(dto.name),
          ...(dto.timeZone
            ? { timeZone: aquariumTimeZoneFrom(dto.timeZone) }
            : {}),
          ...(dto.location
            ? { location: AquariumLocationValue.create(dto.location) }
            : {}),
          establishedAt: dto.establishedAt.toDate(),
        };
      },
    });
  }

  async getOwned(
    ownerKeeperId: string,
    aquariumId: AquariumListItem['id'],
  ): Promise<AquariumListItem | null> {
    const context = await this.getDashboardContextOwned(
      ownerKeeperId,
      aquariumId,
    );
    if (!context) {
      return null;
    }

    return {
      id: context.id,
      name: context.name,
      ...(context.timeZone ? { timeZone: context.timeZone } : {}),
      ...(context.location ? { location: context.location } : {}),
    };
  }

  async getDashboardContextOwned(
    ownerKeeperId: string,
    aquariumId: AquariumDashboardContext['id'],
  ): Promise<AquariumDashboardContext | null> {
    const { firestore } = getFirebaseClient();
    const snapshots = await getDocs(
      query(
        collection(firestore, 'aquariums'),
        where('ownerId', '==', ownerKeeperId),
        where(documentId(), '==', aquariumId),
        limit(1),
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
      ...(dto.timeZone ? { timeZone: aquariumTimeZoneFrom(dto.timeZone) } : {}),
      ...(dto.location
        ? { location: AquariumLocationValue.create(dto.location) }
        : {}),
      parameterTargets: parameterTargetsFromDocument(dto.parameterTargets),
    };
  }
}
