# `@tankos/authz-firestore`

## Purpose

`@tankos/authz-firestore` persists authorization facts for `@tankos/authz`.
It is a storage adapter, not the authorization engine and not a domain policy.

## Responsibilities

- persist active or revoked authorization grants;
- find grants by subject, resource type and optional resource ID;
- save grants using stable document IDs;
- revoke grants without deleting their audit identity;
- validate the minimum shape of data read from Firestore.

The default collection is `authorizationGrants`; hosts can provide a different
collection path for a domain or deployment boundary.

## Persisted model

```ts
interface AuthorizationGrant {
  id: EntityId;
  subjectId: EntityId;
  resourceType: string;
  resourceId: EntityId;
  actions: readonly string[];
  effect: 'allow' | 'deny';
  status: 'active' | 'revoked';
  attributes?: Readonly<Record<string, unknown>>;
}
```

The adapter stores facts, not precomputed `allowed` decisions. Policies must
evaluate current facts so revocation takes effect without waiting for an
authentication token refresh.

## Architecture

```text
domain relationship / policy resolver
                |
                v
       @tankos/authz: AuthorizationGrantStore
                |
                v
 createFirestoreAuthorizationGrantStore
                |
                v
             Firestore
```

The adapter does not interpret `resourceType`, `resourceId` or attributes. A
domain owns their vocabulary and may configure a separate collection or wrap
this store with a typed repository.

## Security boundary

The SDK adapter is not a security boundary. Firestore Security Rules must
independently enforce who may create, change or revoke grants, prevent a
subject from elevating its own permissions, and protect immutable ownership
attributes. Server-side administrative operations should use trusted backend
credentials and transactions where multiple facts change together.

Queries must be bounded and indexed. The adapter cannot safely fetch a broad
collection and filter it in application code for client authorization.

## Decisions and limits

- Revocation changes status to `revoked` while preserving the grant record.
- Grant IDs are supplied by the caller, allowing domain-specific idempotency.
- No timestamps, user invitations or domain foreign keys are imposed here;
  those belong to the owning domain's model.
- The current adapter uses the Firebase client SDK and mocked unit tests. An
  emulator integration target should be added when the first domain persists
  real authorization data.

## Extension guide

Use `createFirestoreAuthorizationGrantStore` as the persistence primitive.
Define domain-specific policy evaluation, typed attributes, query constraints
and Security Rules outside this package. A future non-Firebase implementation
can implement `AuthorizationGrantStore` without changing `@tankos/authz`.
