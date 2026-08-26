# `@tankos/authn-firebase`

## Purpose

`@tankos/authn-firebase` is the Firebase Authentication adapter for the
provider-neutral `@tankos/authn` contract. It is the only package in this
authentication slice that imports the Firebase Auth SDK.

## Responsibilities

- sign in with Firebase email/password credentials;
- sign out the Firebase session;
- wait for Firebase Auth state restoration after a reload;
- resolve the Firebase UID as the neutral principal ID;
- force ID-token renewal when `refresh()` is requested;
- map `roles` or `role` custom claims to neutral roles;
- provide a local emulator helper with a development-only fallback user.

## Architecture

```text
Firebase Auth SDK
        |
        v
createFirebaseAuthSession / createLocalFirebaseAuthSession
        |
        v
@tankos/authn: AuthSessionPort
```

The adapter owns Firebase-specific token behavior and claim parsing. It does
not own domain permissions, resource ACLs, Firestore query policy or Security
Rules.

## Claims policy

Claims are limited to coarse global identity attributes such as `roles`. This
adapter must not store memberships, resource IDs or per-entity permissions in
custom claims. Those values belong to the owning domain's persistence and
authorization policy so they can be revoked without depending on token refresh
timing.

## Local development

`createLocalFirebaseAuthSession` targets the Firebase Auth Emulator and uses a
development-only fallback account when configured for automatic local sign-in.
It must not be used for production credentials or services.

## Decisions and limits

- The adapter currently supports Firebase email/password sign-in.
- `refresh()` forces ID-token renewal when available and then resolves claims
  again.
- Firebase automatically renews tokens in normal operation; explicit refresh
  exists when current claims are required immediately.
- Missing-user handling is limited to the local helper's development flow.

## Testing

Tests mock Firebase Auth functions and cover restoration, sign-in, sign-out,
forced renewal, role claims, fallback roles and expected failures. No
production Firebase project is required.
