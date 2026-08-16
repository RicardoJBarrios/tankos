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

The owner-facing flow uses an invitation code. The owner creates the invitation
and shares the code with the veterinarian or provider. That person signs in to
their existing Firebase account and accepts the invitation; Firestore binds
the grant to the authenticated UID. No email-to-UID lookup, UID input or
backend function is required.
