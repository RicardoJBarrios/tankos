# `@tankos/authn`

Authentication capability split into explicit architectural layers:

- `core`: provider-neutral `AuthSessionPort` contract.
- `composition`: Angular injection token, provider, and route guard.

Feature libraries depend on the core contract. Provider implementations live in
separate libraries; `@tankos/authn-firebase` currently provides the Firebase
adapter without making `@tankos/authn` depend on Firebase.

The session contract covers access context and roles, sign-in, sign-out, and
explicit credential refresh. Adapters own token storage, renewal and provider
claims.

See [`docs/README.md`](docs/README.md) for the full boundary, architecture,
security decisions and extension guide.
