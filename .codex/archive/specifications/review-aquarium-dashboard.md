# Review an Aquarium Dashboard

## Product value

After selecting an Aquarium, the keeper needs a stable place that makes clear
which Aquarium is active and what they can do with it. The Workspace reduces
orientation cost without inventing a summary of Aquarium health.

## Actor

An authenticated keeper with an owned Aquarium selected as Active Context.

## Trigger

The keeper selects an Aquarium from `Mis acuarios` or opens the Workspace route
while a valid Active Context is restored.

## Preconditions

- The keeper is authenticated.
- The selected Aquarium belongs to the keeper and is available.
- Active Context is application state for the current browser tab.

## Success behaviour

The application navigates to `/app/aquariums/current` and shows the selected
Aquarium name with two visible groups:

- `Registrar`: Observation, Measurement and Care Work.
- `Consultar`: Recent Activity, Observation history, Measurement history and
  Care Work history.

Each action keeps its existing route, use case and authorization boundary.
`Mis acuarios` remains the place to switch Aquarium.

## State and data

The Workspace reads the existing owned-Aquarium list only to resolve the active
name. It does not introduce a new persistence model, aggregate, projection or
remote workspace state. Active Context remains owned by the existing
application service and is not replaced by a store.

## Dashboard boundary

The operational surface is now accepted as an Aquarium Dashboard. It contains
Aquarium identity, navigation, bounded current Measurements, recent Activity,
pending Care and ephemeral external Weather context. It does not show health
scores, biological alerts, charts, analytics, AI or automated actions.

## Current Measurements decision

The Workspace presents the five latest known values through direct bounded
queries of the authoritative `measurements` history. Each Parameter uses the
canonical ordering and `limit(1)`; `Sin datos` is an honest missing value, not
an inferred default. This Spark-first design avoids a backend projection while
the catalogue is small. `Measurement` remains the source of truth and `List
Measurements` remains historical. A trusted materialized projection is deferred
until direct reads show a measured need.

## Missing context and unavailable Aquarium

Without Active Context, the Workspace performs no remote read and links back to
`Mis acuarios`. If the active Aquarium is not returned by the owner's list, the
Workspace reports that it could not be loaded and provides the same recovery
path. Rules remain authoritative; client navigation is not authorization.

## Loading and failure

Loading is announced. A failure is visible and recoverable. Capability pages
retain their own loading, empty and error behaviour; the Workspace does not
coordinate their state.

## State management

The scoped `AquariumDashboardStore` owns shared Dashboard context and
configuration state. Forms, history pages, pagination and section-only loading
state remain capability-local when they have no shared consumer. Weather cache
ownership remains with its infrastructure adapter.

## Testing

Angular tests cover missing context, no unnecessary read and visible grouped
navigation. Existing application, integration, Rules and E2E tests remain the
authoritative coverage for the capabilities reached from the Workspace. The
canonical E2E journey must select an Aquarium, enter the Workspace and reach
the existing actions through visible links.

## Deferred scope

Biological interpretation, Dashboard Attention, route-embedded Aquarium IDs,
offline workspace state and shell-level capability navigation remain deferred.

## Definition of Ready

- Product value: Ready.
- Navigation model: Dashboard only, Ready.
- Active Context relationship: existing application state, Ready.
- Persistence: no schema change, Ready.
- Shared state: scoped `AquariumDashboardStore`, Ready.
- Current Measurements: direct Spark-first read, Ready.
- Loading, failure and no-context behaviour: defined, Ready.
- Testing and deferred scope: defined, Ready.
