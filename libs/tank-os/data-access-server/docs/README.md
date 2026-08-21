# Server adapter decisions

This package owns trusted Firebase Admin Auth authorization for batch workers.
It reloads the principal from the server-side auth provider and never treats
browser claims as authoritative. Its public API is only
`@tank-os/data-access-server`.
