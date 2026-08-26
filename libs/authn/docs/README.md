# `@tankos/authn`

## Purpose

`@tankos/authn` defines the provider-neutral authentication boundary for
TankOS. It answers who the current principal is and manages that session. It
does not decide what the principal may do with a domain resource.

## Responsibilities

- expose the `AuthSessionPort` contract;
- sign in and sign out through an injected provider implementation;
- resolve the current `AccessContext`;
- expose coarse roles carried by the active identity;
- request explicit credential renewal;
- provide Angular composition through `AUTH_SESSION`, `provideAuthSession` and
  `authGuard`.

`AccessContext` contains only the principal, coarse roles and an optional
request identifier. It intentionally contains no Aquarium, Unit or other
domain-specific attribute.

## Architecture

```text
application / UI
        |
        v
@tankos/authn: AuthSessionPort + Angular composition
        |
        v
provider adapter, for example @tankos/authn-firebase
```

The core has no Firebase dependency. A future OAuth, OIDC or custom provider
must implement the same port without changing feature libraries.

## Security boundary

Authentication proves the identity of a principal; it is not authorization.
Roles returned in the access context are coarse identity attributes only. They
must not contain resource IDs or per-resource permissions. Domain
authorization belongs to `@tankos/authz` and to the security rules or backend
owned by the relevant domain.

The route guard is a navigation convenience, never the security boundary for
persisted data.

## Decisions and limits

- Credentials are opaque records so the contract is not coupled to
  email/password authentication.
- `refresh()` is explicit at the neutral boundary. Providers may also perform
  background renewal.
- Provider errors are adapted by the provider library; this package owns only
  the neutral contract and `AuthRequiredError`.
- Angular composition is separate from the core types for non-Angular users.

## Extension guide

Add a provider in a separate library named `@tankos/authn-<provider>`. It should
map provider identity data to `AccessContext` without adding domain
authorization rules or provider SDK imports to this package.

## Current status

The contract, Angular composition, login guard and provider boundary are
implemented. Resource-level ABAC is intentionally separate in `@tankos/authz`.
