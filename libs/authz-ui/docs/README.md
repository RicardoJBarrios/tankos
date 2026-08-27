# `@tankos/authz-ui`

## Purpose

`@tankos/authz-ui` adapts the provider-neutral authorization boundary to
Angular Router. It centralizes the navigation outcome for protected routes:
an unauthenticated session goes to `/login`, while an authenticated session
whose route policy denies access goes to `/forbidden`.

## Architecture

The library depends on the neutral `AuthSessionPort` and `AccessContext`
contracts. It does not know about aquariums, units, Firebase, Firestore or
domain entities. A host supplies an `AuthorizationRoutePolicy`, which can be a
simple role policy or a domain-specific ABAC decision.

```ts
const unitsAuthorizationGuard = createAuthorizationGuard({
  policy: requireAnyRole('keeper', 'admin'),
});
```

`@tankos/authz` remains framework-independent. Provider adapters such as
`@tankos/authz-firestore` remain responsible for persistence and security
facts, while this package only handles Angular navigation composition.

## Limits and security

- A Router guard is a user-experience boundary, not the security boundary.
- Firestore rules or a trusted backend must enforce the same authorization
  decision.
- The default behavior is restrictive: a policy must explicitly return true.
- Unexpected session or policy errors are rethrown for global error handling.

## Testing

Run `nx test authz-ui` for the complete unit suite and coverage report.
