# Review an Aquarium Workspace

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

This increment defines a Workspace, not a Dashboard. It contains identity and
navigation only. It does not show Current Measurements, health scores, alerts,
charts, analytics, AI, planned care or other summaries.

## Current Measurements decision

`measurementCurrentStates/{aquariumId}` remains deferred. The Workspace does
not yet consume current values, so it is not the first real consumer that
crosses the projection implementation threshold. `Measurement` remains the
source of truth and `List Measurements` remains historical.

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

No Signal Store is required. The Workspace has no shared dynamic read state
beyond Active Context, and its name is route-local state. Forms, history pages,
pagination and recent activity remain capability-local.

## Testing

Angular tests cover missing context, no unnecessary read and visible grouped
navigation. Existing application, integration, Rules and E2E tests remain the
authoritative coverage for the capabilities reached from the Workspace. The
canonical E2E journey must select an Aquarium, enter the Workspace and reach
the existing actions through visible links.

## Deferred scope

Dashboard summaries, Current Measurements, Timeline previews, route-embedded
Aquarium IDs, shared workspace refresh state, Signal Store, planned care,
offline workspace state and shell-level capability navigation remain deferred.

## Definition of Ready

- Product value: Ready.
- Navigation model: Workspace only, Ready.
- Active Context relationship: existing application state, Ready.
- Persistence: no schema change, Ready.
- Shared state: no store, Ready.
- Current Measurements: explicitly deferred, Ready.
- Loading, failure and no-context behaviour: defined, Ready.
- Testing and deferred scope: defined, Ready.
