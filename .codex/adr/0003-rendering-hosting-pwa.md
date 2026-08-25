# ADR-0003: Static rendering, Firebase Hosting and PWA

## Status

Accepted

## Context

Public content needs SEO and low-cost delivery, while authenticated content needs
client interactivity and offline access. See the
[target architecture](../archive/architecture/target-architecture.md).

## Decision

Prerender public routes as static HTML and render private routes with CSR and lazy
loading. Deploy both through Firebase Hosting without a permanent SSR runtime.

Use Angular Service Worker for app-shell and asset caching, installability and
coherent background updates. On `VERSION_READY`, show a discreet prompt and reload
the page only when the current tab has no unsaved UI work or tracked pending
mutations. Do not use `activateUpdate()` without reload. Firestore, authenticated
responses and tokens are outside the service-worker cache.

Use temporary Hosting Preview Channels for useful PR previews. A visual preview
has a fail-closed, backend-free build. A functional preview uses only an explicitly
isolated non-production Firebase project with synthetic, access-isolated data.

## Consequences

- Public pages remain cacheable and independent of a server runtime.
- Unvisited lazy chunks are not guaranteed offline.
- Preview URLs are public and their project backend is real.
- PWA update UX must account for dirty and pending state.

## Implementation timing

The app-shell PWA direction remains in place. `Establish an Aquarium` requires
neither public Aquarium presentation nor advanced update, synchronization or
offline domain behavior. Public presentation is deferred and all care data is
private by default until a publication use case is accepted.

## Alternatives considered

- Permanent SSR or App Hosting: rejected without a dynamic rendering requirement.
- A custom service worker: rejected while Angular covers the required behavior.
- Production backend for previews: rejected.
