import {
  collection,
  doc,
  getDocs,
  limit,
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

const MAX_ID_LENGTH = 128;
const MAX_RESOURCE_TYPE_LENGTH = 128;
const MAX_ACTION_LENGTH = 64;

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
      const snapshot = await getDocs(query(grants, ...constraints, limit(100)));
      return snapshot.docs.map((item) => parseGrant(item.id, item.data()));
    },
    save: async (grant) => {
      await setDoc(doc(grants, grant.id), serializeGrant(grant));
    },
    revoke: async (grantId) => {
      if (!isBoundedId(grantId))
        throw new TypeError(
          `Invalid authorization grant id: ${String(grantId)}`,
        );
      await updateDoc(doc(grants, grantId), {
        status: 'revoked',
      });
    },
  };
}

function serializeGrant(grant: AuthorizationGrant): AuthorizationGrant {
  validateGrant(grant);
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
    hasOnlyGrantFields(value),
    isBoundedId(value['subjectId']),
    isBoundedText(value['resourceType'], MAX_RESOURCE_TYPE_LENGTH),
    isBoundedId(value['resourceId']),
    isSafeStringArray(value['actions']),
    isEffect(value['effect']),
    isStatus(value['status']),
    !('attributes' in value) ||
      value['attributes'] === null ||
      isSafeAttributes(value['attributes']),
  ].every(Boolean);
}

function hasOnlyGrantFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) =>
    [
      'id',
      'subjectId',
      'resourceType',
      'resourceId',
      'actions',
      'effect',
      'status',
      'attributes',
    ].includes(key),
  );
}

function validateGrant(grant: AuthorizationGrant): void {
  if (
    !isBoundedId(grant.id) ||
    !isValidGrant(grant as unknown as Record<string, unknown>)
  )
    throw new TypeError(`Invalid authorization grant: ${String(grant.id)}`);
}

function isBoundedId(value: unknown): value is string {
  return isBoundedText(value, MAX_ID_LENGTH) && !value.includes('/');
}

function isBoundedText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}

function isSafeStringArray(value: unknown): value is readonly string[] {
  return (
    isStringArray(value) &&
    value.length > 0 &&
    value.length <= 32 &&
    value.every((item) => isBoundedText(item, MAX_ACTION_LENGTH))
  );
}

function isSafeAttributes(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    Object.keys(value).length <= 32 &&
    Object.values(value).every(
      (item) =>
        item === null ||
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean',
    )
  );
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
