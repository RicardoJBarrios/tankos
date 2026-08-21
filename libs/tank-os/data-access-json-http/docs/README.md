# JSON/HTTP adapter decisions

This package owns JSON/HTTP transport integration and Zod validation at the
boundary. It depends on the provider-independent CRUD contracts and exposes
only `@tank-os/data-access-json-http`.
