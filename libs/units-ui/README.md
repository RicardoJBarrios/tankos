# `@tankos/units-ui`

UI boundary for the units feature.

The feature service exposes reactive signals and `void` commands. Consumers do
not know whether the underlying application service uses promises, observables,
or another asynchronous mechanism. Authentication is received through the
`AuthSessionPort` contract; Firebase, Firestore, and Zod remain outside this
library.

The application composes this facade with the units application service and an
authentication adapter at the composition root.
