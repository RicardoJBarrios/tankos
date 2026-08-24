# Server adapter decisions

This package owns trusted Firebase Admin Auth authorization for batch workers.
It reloads the principal from the server-side auth provider and never treats
browser claims as authoritative. Its public API is only
`@tankos/data-access-server`.

The browser `AccessContext.roles` value is only request metadata and is never
used to grant a worker permission. Authorization receives both the authenticated
caller id and the persisted batch principal id. It succeeds only when they
match and the configured role is present in authoritative custom claims.

It deliberately does not execute Firestore batches. The durable Admin batch
store and trusted chunk executor are published as
`@tankos/data-access-firestore-admin`, which depends on this authorization
boundary at the host composition layer. This keeps authorization composable
with another trusted scheduler or store and keeps the Admin Firestore runtime
out of browser bundles.

Firebase Admin calls are trusted server calls and bypass Firestore Security
Rules. The host must enforce least-privilege IAM/service-account scope and
compose this authoritative claims check before invoking an administrative batch.
Client Rules and emulator tests protect the browser Firestore path, but do not
replace the server boundary.
