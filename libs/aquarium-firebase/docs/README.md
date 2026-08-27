# Aquarium Firebase

## Responsibility

`@tankos/aquarium-firebase` will adapt the Aquarium application ports to
Firebase Auth/Firestore. It is infrastructure, not the Aquarium domain.

## Boundary

The adapter may depend on `@tankos/aquarium`, `@tankos/authn`, `@tankos/authz`,
Firebase and Zod. The domain must never depend on this library. Configuration,
emulator selection, Rules and indexes remain owned by the TankOS composition
root.

## Pending persistence decisions

The Aquarium document and membership representation must be designed together
with the access use case. The adapter must support multiple keepers, reject
non-members in Rules, validate all external DTOs and use bounded queries.

No collection, index or route is introduced by this scaffold alone.
