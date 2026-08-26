# `@tankos/auth`

Authentication capability split into explicit architectural layers:

- `core`: provider-neutral `AuthSessionPort` contract.
- `composition`: Angular injection token, provider, and route guard.
- `adapters`: Firebase implementation of the port.

Feature libraries depend on the core contract. Only the application composition
root selects the Firebase adapter and wires the token.
