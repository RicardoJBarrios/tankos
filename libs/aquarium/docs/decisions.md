# Aquarium decisions

This document is the source of truth for the Aquarium vertical. Product and
implementation decisions about Aquarium must be made here and not duplicated in
the workspace archive.

## Domain

- `Aquarium` is the aggregate root for one managed physical aquarium system.
- The system is not classified by a closed freshwater/marine enum. Connected
  display, sump, refugium or other components belong to the same system when
  that model is introduced.
- An Aquarium may have multiple keeper members.
- The creator is the initial member/manager. Membership roles, invitations and
  per-capability permissions are an access concern and must be explicit; they
  are not inferred from Firebase claims or route visibility.
- The aggregate does not embed membership grants, measurements, observations,
  care, livestock or equipment.

## First use cases

The first complete slice is private and online-required:

1. Establish an Aquarium with a non-empty name and a system-generated opaque
   identity.
2. List Aquariums for which the current keeper has an active membership.
3. Select one accessible Aquarium as application-level Active Context.

Each Aquarium remains independently addressable and a keeper may establish or
access several. The concrete route hierarchy is a UI decision and is not fixed
by this document.

Successful establishment records one attributable `AquariumEstablished` fact.
It is immutable, occurs once for that Aquarium lifecycle and is not recreated
by retries, renaming, publication or later support for multiple keepers.

## Access and security

- Authentication identifies the current keeper; Aquarium authorization evaluates
  membership and capability.
- Firestore Security Rules are the authoritative boundary. Guards only improve
  navigation and loading behaviour.
- Unauthenticated and non-member reads are denied.
- Client-side filtering, route parameters and stored context hints never grant
  access.
- A tab-scoped Active Context hint is untrusted and must be revalidated before
  use; logout or failed validation clears it.

## Persistence direction

The minimum Aquarium data is its opaque identity, name, establishment instant
and initial membership association. The exact membership representation,
collection layout, indexes and query strategy are intentionally pending until
the membership/access use case is specified. Do not introduce a generic
repository, event store, Timeline projection or speculative subcollections.

External DTOs are validated at the Firebase adapter boundary. Writes and reads
must be bounded, member-scoped and covered by Emulator Suite Rules tests.

## Subsequent capabilities

These are accepted directions but not part of the first establishment slice:

- one-way configuration of the Aquarium's canonical IANA timezone;
- approximate location and ephemeral local weather context;
- Aquarium-specific parameter targets;
- a contextual workspace/dashboard with bounded sections.

Their detailed rules must be added here before implementation. Public
presentation, collaboration workflows, offline writes, analytics, biological
interpretation, automation and AI remain outside the current slice.

### Timezone

`Aquarium.timeZone` is the optional canonical IANA timezone for timestamps and
calendar care. Persisted values remain absolute instants. The first
configuration is a confirmed one-way transition from absent to configured;
changing, clearing or inferring it automatically is a later capability.

### Approximate location and weather

Location is optional, member-authorized configuration containing rounded
latitude and longitude (two decimal places) plus a concise locality label. No
address, provider payload or precise place identifier is persisted. The first
weather integration is an ephemeral Open-Meteo read, subject to its free,
rate-limited and non-commercial MVP boundary; weather is not a Measurement or
Timeline source.

### Parameter targets

An Aquarium may have at most one optional target interval for each canonical
Parameter. A target is configuration, not a Measurement, recommendation,
alert, status or biological limit. It uses finite non-negative values with
`minimum <= maximum`; absence means `uninterpreted`. Target configuration is
separate from Measurement history and does not rewrite historical records.

### Workspace

After selection, the Aquarium workspace may compose bounded sections for
identity, current Measurements, recent Activity, pending Care and ephemeral
weather. It must not become a generic widget engine or own the domain pages,
stores or use cases of those other verticals. Health scores, analytics, AI,
automation and biological interpretation are outside this decision.

## Architecture

`@tankos/aquarium` owns domain and application contracts.
`@tankos/aquarium-firebase` owns Firebase/Firestore adapters.
`@tankos/aquarium-ui` owns Angular presentation and route composition.
`apps/tankos` composes providers and mounts the vertical.
