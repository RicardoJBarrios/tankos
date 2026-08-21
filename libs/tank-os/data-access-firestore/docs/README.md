# Firestore adapter decisions

This package is the physical Firebase Firestore boundary for
`@tank-os/data-access`. It owns Firestore SDK calls, Firestore timestamp
mapping, Zod DTO validation, pagination query construction and emulator tests.

The package must not leak Firestore types into the provider-independent core.
Its public API is only `@tank-os/data-access-firestore`.
