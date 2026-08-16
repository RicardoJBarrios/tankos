# Delegated Aquarium access

Delegated access is scoped to one Aquarium and one authenticated grantee. It
is not a Firebase custom claim or a global role.

The Firestore document ID is deterministic:

```text
<aquariumId>_<granteeUserId>
```

The owner can grant these read-only categories:

- `aquarium`
- `measurements`
- `observations`
- `careWorks`
- `plannedCareWorks`
- `recurringCarePlans`
- `livestock`

The grant is active or revoked. Revocation preserves the grant document and
immediately blocks further reads. A grantee can never write Aquarium data or
grant documents.

The owner-facing management flow still requires an invitation/identity
decision: the application must resolve a veterinarian or provider to a
Firebase user account without asking owners to copy technical UIDs. Until that
flow exists, grants should be created through a controlled application service
or fixture, not by exposing a UID field in the user interface.
