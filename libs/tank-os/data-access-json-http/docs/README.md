# JSON/HTTP adapter decisions

This package owns JSON/HTTP transport integration and Zod validation at the
boundary. It depends on the provider-independent CRUD contracts and exposes
only `@tank-os/data-access-json-http`.

Mutations require `AccessContext.requestId` and forward it as an idempotency
key. The host transport owns the actual retry policy and may attach an
`AbortSignal`; the library does not retry blindly because a retry is safe only
when the server implements the same idempotency contract.
