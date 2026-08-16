import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { z } from 'zod';
import {
  AQUARIUM_ACCESS_PERMISSIONS,
  AquariumAccessGrant,
  AquariumAccessPermission,
  AquariumAccessPermissions,
  AquariumAccessService,
  SharedAquariumView,
} from '../application/ports';
import { createUuidV4 } from '../../shared/domain/uuid-v4';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';

const permissionsSchema = z.record(
  z.enum(AQUARIUM_ACCESS_PERMISSIONS),
  z.boolean(),
);

const grantSchema = z.object({
  granteeUserId: z.string(),
  permissions: permissionsSchema,
  status: z.enum(['active', 'revoked']),
});

const aquariumSchema = z.object({ name: z.string() });

export class FirestoreAquariumAccessService implements AquariumAccessService {
  async createInvitation(input: {
    readonly aquariumId: string;
    readonly ownerId: string;
    readonly permissions: AquariumAccessPermissions;
  }) {
    const code = createUuidV4();
    const { firestore } = getFirebaseClient();
    await setDoc(doc(firestore, 'aquariumAccessInvitations', code), {
      aquariumId: input.aquariumId,
      ownerId: input.ownerId,
      permissions: input.permissions,
      status: 'active',
      createdAt: Timestamp.now(),
    });
    return { code, permissions: input.permissions };
  }

  async listGrants(input: {
    readonly aquariumId: string;
    readonly ownerId: string;
  }): Promise<readonly AquariumAccessGrant[]> {
    const { firestore } = getFirebaseClient();
    const snapshot = await getDocs(
      query(
        collection(firestore, 'aquariumAccessGrants'),
        where('aquariumId', '==', input.aquariumId),
        where('ownerId', '==', input.ownerId),
      ),
    );
    return snapshot.docs.map((entry) => {
      const grant = grantSchema.parse(entry.data());
      return {
        id: entry.id,
        granteeUserId: grant.granteeUserId,
        permissions: grant.permissions,
        status: grant.status,
      };
    });
  }

  async revokeGrant(input: {
    readonly grantId: string;
    readonly revokedAt: Date;
  }): Promise<void> {
    const { firestore } = getFirebaseClient();
    await updateDoc(doc(firestore, 'aquariumAccessGrants', input.grantId), {
      status: 'revoked',
      revokedAt: Timestamp.fromDate(input.revokedAt),
    });
  }

  async readSharedAquarium(input: {
    readonly aquariumId: string;
  }): Promise<SharedAquariumView> {
    const { firestore, auth } = getFirebaseClient();
    const user = auth.currentUser;
    if (!user || user.isAnonymous) throw new Error('Authentication required');

    const aquariumSnapshot = await getDoc(
      doc(firestore, 'aquariums', input.aquariumId),
    );
    const aquarium = aquariumSchema.parse(aquariumSnapshot.data());
    const grantSnapshot = await getDoc(
      doc(firestore, 'aquariumAccessGrants', `${input.aquariumId}_${user.uid}`),
    );
    const grant = grantSchema.parse(grantSnapshot.data());
    if (grant.status !== 'active') throw new Error('Access revoked');

    const sections: Partial<Record<AquariumAccessPermission, number>> = {};
    const collections: Partial<Record<AquariumAccessPermission, string>> = {
      measurements: 'measurements',
      observations: 'observations',
      careWorks: 'careWorks',
      plannedCareWorks: 'plannedCareWorks',
      recurringCarePlans: 'recurringCarePlans',
      livestock: 'livestock',
    };
    for (const [permission, collectionName] of Object.entries(collections)) {
      if (grant.permissions[permission as AquariumAccessPermission] !== true)
        continue;
      const snapshot = await getDocs(
        query(
          collection(firestore, collectionName),
          where('aquariumId', '==', input.aquariumId),
          limit(50),
        ),
      );
      sections[permission as AquariumAccessPermission] = snapshot.size;
    }

    return {
      aquariumName: aquarium.name,
      sections: {
        ...(grant.permissions.aquarium === true ? { aquarium: 1 } : {}),
        ...sections,
      },
    };
  }
}
