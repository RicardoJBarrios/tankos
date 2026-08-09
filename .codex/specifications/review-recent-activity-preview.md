# Review Recent Activity Preview

**Status:** Implemented; pending final review.

## Product value

After opening an Aquarium, the keeper should see a small amount of recent
context without leaving the Workspace. This complements the latest known
Measurements with evidence of what was observed, measured or done recently.

## Actor and trigger

The actor is an authenticated keeper with an owned Aquarium in Active Context.
The preview loads when `/app/aquariums/current` is opened or revisited.

## Scope

The Workspace shows at most three recent Timeline items and provides a link to
the complete `Actividad reciente` view. The preview may contain Observations,
Measurements and completed Care Work already supported by the existing Timeline
read model.

It does not add a Timeline collection, new historical semantics, filters,
pagination, charts, summaries, health scores, alerts, planned Care Work or
interpretations.

## Read contract

The preview reuses the existing Timeline application language and source
readers. Each source is queried for a small capability-local limit of three;
the application merges the results using the accepted Timeline ordering and
keeps the first three items. It must not duplicate Timeline mapping or create a
second source of truth.

The existing full Timeline view remains responsible for its limit and complete
bounded recent view. The preview limit is a presentation/read-use-case concern,
not a domain rule.

## Preconditions and authorization

- the keeper is authenticated;
- Active Context contains an owned available Aquarium;
- Firestore Rules remain authoritative for every source query;
- client state and navigation are not authorization mechanisms.

Without Active Context, the preview performs no query and links to `Mis
acuarios`. An unavailable Aquarium uses the existing Workspace recovery state.

## Observable behaviour

- loading is announced accessibly;
- an empty result is a valid state and links to a relevant recording action;
- a read failure is visible and offers retry without blocking the rest of the
  Workspace;
- each item uses the existing semantic presentation for its source type;
- the preview identifies itself as recent activity and links to `Actividad
reciente`;
- the active Aquarium identity and existing `Registrar`/`Consultar` actions
  remain visible.

The preview is additive: failure or absence of recent activity must not hide
Current Measurements or the navigation actions.

## Query cost

The current Workspace performs five bounded Measurement queries. The preview
adds three bounded source queries and can return at most nine source documents
before the application keeps three items. This is acceptable for the current
Spark-first baseline as a bounded experiment, but reads should be measured
after implementation. No projection, cache, Store or Blaze dependency is
justified by this increment.

## State and architecture

Preview loading, items and error state remain local to the preview component.
Active Context remains the only shared application state. Re-entering the
Workspace naturally refreshes the reads; no invalidation or coordination layer
is required. Timeline remains a derived read model and `Measurement`,
`Observation` and `Care Work` remain their own sources of truth.

No new aggregate, domain event, collection, Nx project, generic reader,
Signal Store or Dashboard framework is required.

## Deferred scope

- complete Timeline history and pagination;
- Timeline filters and contextual navigation;
- planned or scheduled Care Work;
- health interpretation, alerts, charts and AI;
- offline caching or cross-section refresh coordination;
- materialized current or Timeline projections.

## Testing strategy

- application: reuse the existing Timeline ordering and source-reader contract;
- Angular: loading, empty, failure, three-item cap, visible link and
  non-blocking failure behaviour;
- integration and Rules: only additional query behaviour not already covered
  by the existing Timeline tests;
- E2E: open the Workspace with existing evidence, verify a recent item and
  navigate to the complete Timeline view.

## Definition of Ready

- user value and scope: explicit;
- source of truth: existing Observation, Measurement and Care Work records;
- ordering: existing Timeline ordering;
- query limit and cost: explicit;
- Active Context and authorization: existing boundaries;
- empty, loading and failure behaviour: explicit;
- architecture impact: no new aggregate, persistence model or shared store;
- testing and deferred scope: explicit.
