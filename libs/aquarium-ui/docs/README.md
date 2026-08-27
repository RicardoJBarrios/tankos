# Aquarium UI

## Responsibility

`@tankos/aquarium-ui` owns Angular presentation, forms, pages and route
composition for Aquarium use cases.

## Boundary

The UI consumes `@tankos/aquarium` application contracts and shared feedback,
observability and data-access UI capabilities. It must not contain Firestore
queries, authorization rules or domain invariants. `apps/tankos` only composes
providers and mounts the vertical.

## Routing decision

No Aquarium route is fixed yet. The route hierarchy will be chosen after the
keeper journey and the multiple-keeper access flow are defined. Route guards
remain navigation aids; Firestore Rules are the security boundary.

## Planned first screens

Establish, list and select an accessible Aquarium, followed by a contextual
workspace. Dashboard sections and capability pages remain independently owned
by their domains.
