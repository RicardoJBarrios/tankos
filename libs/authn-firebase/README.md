# `@tankos/authn-firebase`

Firebase Auth implementation of the provider-neutral `@tankos/authn` contract.

The package contains the Firebase session adapter and the local emulator helper.
The core auth library has no dependency on Firebase, so another provider can be
added without changing feature libraries.

The adapter renews tokens on `refresh()`, waits for Firebase Auth state
restoration after reloads, and maps `roles` or `role` custom claims into the
provider-neutral access context. Configured roles are used as the fallback for
the local emulator.

See [`docs/README.md`](docs/README.md) for the adapter boundary, claims policy,
local-development rules and testing strategy.
