import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import type {
  AuthorizationGrant,
  AuthorizationGrantQuery,
  AuthorizationGrantStore,
} from '@tankos/authz';
import type { EntityId } from '@tankos/data-access';

export interface FirestoreAuthorizationGrantStoreOptions {
  readonly firestore: Firestore;
  readonly collectionPath?: string;
}

/** Creates a Firestore persistence adapter for authorization facts. */
export function createFirestoreAuthorizationGrantStore(
  options: FirestoreAuthorizationGrantStoreOptions,
): AuthorizationGrantStore {
  const collectionPath = options.collectionPath ?? 'authorizationGrants';
  const grants = collection(options.firestore, collectionPath);

  return {
    find: async (request) => {
      const constraints = [
        where('subjectId', '==', request.subjectId),
        where('resourceType', '==', request.resourceType),
        ...(request.resourceId
          ? [where('resourceId', '==', request.resourceId)]
          : []),
        where('status', '==', request.status ?? 'active'),
      ];
      const snapshot = await getDocs(query(grants, ...constraints));
      return snapshot.docs.map((item) => parseGrant(item.id, item.data()));
    },
    save: async (grant) => {
      await setDoc(doc(grants, grant.id), serializeGrant(grant));
    },
    revoke: async (grantId) => {
      await updateDoc(doc(grants, grantId), {
        status: 'revoked',
      });
    },
  };
}

function serializeGrant(grant: AuthorizationGrant): AuthorizationGrant {
  return grant;
}

function parseGrant(
  id: string,
  value: Record<string, unknown>,
): AuthorizationGrant {
  if (!isValidGrant(value)) {
    throw new TypeError(`Invalid authorization grant: ${id}`);
  }
  const attributes = value['attributes'];
  return {
    id: id as EntityId,
    subjectId: value['subjectId'] as EntityId,
    resourceType: value['resourceType'] as string,
    resourceId: value['resourceId'] as EntityId,
    actions: value['actions'] as readonly string[],
    effect: value['effect'] as AuthorizationGrant['effect'],
    status: value['status'] as AuthorizationGrant['status'],
    ...(isRecord(attributes) ? { attributes } : {}),
  };
}

function isValidGrant(value: Record<string, unknown>): boolean {
  return [
    typeof value['subjectId'] === 'string',
    typeof value['resourceType'] === 'string',
    typeof value['resourceId'] === 'string',
    isStringArray(value['actions']),
    isEffect(value['effect']),
    isStatus(value['status']),
  ].every(Boolean);
}

function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isEffect(value: unknown): value is AuthorizationGrant['effect'] {
  return value === 'allow' || value === 'deny';
}

function isStatus(value: unknown): value is AuthorizationGrant['status'] {
  return value === 'active' || value === 'revoked';
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type { AuthorizationGrantQuery };
