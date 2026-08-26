# `@tankos/authz`

## Purpose

`@tankos/authz` provides the provider-neutral ABAC contract used to evaluate
whether a subject may perform an action on a resource. It is deliberately
domain-agnostic: it does not know about Aquariums, Units, Firebase or any
other business aggregate.

## Responsibilities

- describe a subject with an ID, coarse roles and optional attributes;
- describe a resource with a domain-owned type, ID and attributes;
- carry an action and optional environment attributes;
- compose a domain-owned synchronous or asynchronous policy;
- expose `can()` and `authorize()` decisions;
- raise `AuthorizationDeniedError` for rejected operations.

## Contract

```ts
const authorization = createAuthorizationPort((request) => {
  // The owning domain interprets these attributes.
  return request.action === 'read';
});
```

The library transports attributes but does not interpret their names. A domain
may use ownership, visibility, lifecycle, membership or other attributes from
its own model.

## Architecture

```text
domain policy / relationship resolver
                |
                v
        createAuthorizationPort
                |
                v
        AuthorizationPort
                |
                v
application and persistence boundaries
```

If a domain needs Firestore data, its own adapter or relationship resolver
supplies it. The generic library never queries a domain collection by
convention.

## Security boundary

This TypeScript policy is an application-level decision component. It is not a
replacement for backend enforcement or Firestore Security Rules. Direct
client access must still be constrained by provider rules that independently
validate immutable ownership fields, ACL changes and query shape.

Hosts should deny by default and make ownership, inheritance, overrides and
administrative actions explicit in the domain policy. Roles are only one input.

## Decisions and limits

- Resource and action names are strings because only the owning domain defines
  their vocabulary.
- Attributes are opaque to this library and are not persisted here.
- `can()` is for conditional UI or branching; `authorize()` enforces a command
  boundary and produces a typed denial.
- Firestore ACL stores, query builders and domain policies belong in separate
  packages.
- No Aquarium-specific context is allowed here.

## Extension guide

Each domain should define typed resource attributes and policy helpers in its
own library. A future units policy or aquarium policy can evolve independently
without adding domain knowledge to `@tankos/authz`.

## Current status

The generic authorization contract and policy composition are implemented and
covered by unit tests. Domain policies and persistence-backed relationship
resolution are the next implementation layer.
