# Coral Mastery Gap and TankOS Improvement Plan

**Status:** candidate product plan; implementation is not authorized by this
document.

**Decision authority:** the user/product owner. Capability selection,
prioritization, exclusion and final implementation shape remain pending unless
an explicit user decision is recorded in
[`PRODUCT_IDEA_REGISTER.md`](PRODUCT_IDEA_REGISTER.md).

**Evidence date:** 2026-08-20.

**Compared product:** Coral Mastery web application v11.13.6, exercised through
an authenticated free account without purchases, reservations, subscriptions or
commercial contact.

This document records a comparative product audit and turns the useful findings
into small, ordered improvement candidates for TankOS. It is written so that an
implementation agent with limited context can execute one accepted slice at a
time without copying Coral Mastery's domain assumptions or weakening TankOS's
history, authorization and evidence rules.

Broader external proposals around an Aquarium Digital Model, evidence graphs,
computer vision, quantitative scenarios, IoT, spatial planning and integrated
assistance are evaluated and sequenced separately in
[`AQUARIUM_INTELLIGENCE_VISION.md`](AQUARIUM_INTELLIGENCE_VISION.md). Those
strategic horizons depend on the trustworthy foundations in this plan and must
not be pulled into an immediate phase by implication.

It complements, and does not replace:

- [`../VISION.md`](../core/VISION.md));
- [`MENTAL_MODEL.md`](MENTAL_MODEL.md);
- [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md);
- [`UX_PHILOSOPHY.md`](UX_PHILOSOPHY.md);
- [`CAPABILITY_MAP.md`](CAPABILITY_MAP.md);
- [`UX_IMPLEMENTATION_PATH.md`](UX_IMPLEMENTATION_PATH.md);
- accepted use-case specifications under [`../specifications/`](../specifications/).

## 1. How to use this plan

An implementation agent must follow these process rules after the user selects
a phase:

1. Work on exactly one numbered phase or one explicitly named subphase per
   task.
2. Treat every phase marked `candidate` as discovery work until its use-case
   specification is accepted.
3. Read [`.codex/AGENT.md`](../../AGENT.md)), the documents named by the selected
   phase and the current files listed by that phase before editing.
4. Inspect the current implementation and Git status. File lists in this plan
   are starting points, not permission to overwrite concurrent work.
5. Preserve existing routes, aggregates, Firestore collections and Security
   Rules unless the accepted specification explicitly changes them.
6. Implement the smallest end-to-end result. Do not combine adjacent phases to
   save time.
7. Run the focused validation listed by the phase plus the repository-wide
   checks required by [`../DEFINITION_OF_DONE.md`](../core/DEFINITION_OF_DONE.md)).
8. Append a completion record to section 12. Never rewrite the audit evidence
   to make a later implementation appear cleaner.

### Mandatory stop conditions

Stop before implementation and report the missing decision when any of these is
true:

- the selected phase has no accepted specification;
- a new value would be presented as a universal biological target;
- source evidence would be updated or deleted instead of corrected through an
  accepted traceable workflow;
- a chart, score or assistant would imply diagnosis or causality unsupported by
  the recorded evidence;
- background delivery, image processing or AI would start without explicit
  consent, retention and failure behavior;
- the change requires a generic `Task`, generic `Record`, generic `Event` or
  generic workflow abstraction;
- authorization would depend on hidden UI or Active Context instead of
  Firestore Rules;
- a commercial feature, loyalty balance or product recommendation is being
  added without a separate product decision.

## 2. Audit method and evidence limits

The audit used one fictitious Aquarium named `TankOS` with 105 litres, invented
equipment and inhabitants, three historical Measurement sets, one Water Change
log entry, one weekly routine and one CoralBot conversation. The account's
existing personal identity and contact data were not part of the analysis and
must not be copied into TankOS documentation or fixtures.

The following flows were exercised or inspected:

- Aquarium creation, selection and detailed configuration;
- Parameter entry, calculators, observations and advanced fields;
- current state, fixed ranges, health score and trend cards;
- historical records, charts, comparison laboratory and edit/delete actions;
- activity log, quick actions, past/present/future actions and photos;
- recurring routines, filters, completion and deletion affordances;
- CoralBot text assistance and photo-intent entry points;
- push preferences, notification inbox and account settings;
- app sharing, wish list, opportunities, loyalty balance and Premium surfaces.

No purchase, reservation, wish, subscription, WhatsApp contact, marketplace
action, notification deletion, account deletion or Premium-only action was
performed. Photo recognition and push delivery were inspected but not executed,
so their output quality and cross-device delivery remain unverified.

This is a product comparison, not a reverse-engineered contract. Observed
behavior may change in later Coral Mastery versions.

## 3. Coral Mastery flow inventory

### 3.1 Aquarium setup

Initial creation asks for a name and mounting month. A later form adds volume,
Aquarium classification, dimensions, lighting, photoperiod, skimmer, mechanical
filtration, circulation, controller, heater, salt, water-change cadence, source
water, automatic top-off, refugium and nutrient-control options. Dosing method,
dosing equipment and daily quantities can also be recorded.

Fauna, coral and invertebrates are stored as descriptive text in this setup
surface. Equipment likewise behaves primarily as configuration text rather than
as independently managed lifecycle records.

### 3.2 Measurement entry

The main form supports KH, calcium, magnesium, phosphate, nitrate, specific
gravity and temperature. pH and a broader trace/contaminant catalogue are
available in an advanced section. The observed catalogue also included
potassium, strontium, boron, bromine, sulphur, iodine, iron, zinc, manganese,
vanadium, fluorine, molybdenum, nickel, chromium, cobalt, aluminium, silicon,
copper, tin, lead, ammonia, nitrite and organic phosphate.

The form includes test timers, brand-specific calculators, SG/PPT switching,
dosing quantities and structured checklists for algae, pests, turbidity and
coral condition. It offers photo-assisted test reading and ICP extraction.

Most numeric inputs exposed a decimal step but no browser-level minimum or
maximum. The server's treatment of impossible or negative values was not tested
because inserting deliberately corrupt data was outside the safe audit scope.

### 3.3 State and interpretation

Coral Mastery compares the latest values against product-defined ranges and
labels them as optimal or otherwise. It calculates a health score, daily trend,
stability percentage and distance to a fixed target. The observed fixed ranges
were not explained as keeper-owned configuration.

After three Measurement sets, the application described the Aquarium as
balanced and displayed trends and stability percentages. The formula and
minimum evidence requirements were not fully exposed.

### 3.4 History and analytics

History supports 7, 30 and 90 day windows plus the full period. Individual
series can be displayed, added, edited or permanently deleted. Whole historical
records can also be edited or deleted.

The laboratory surface includes:

- a radar comparison with natural seawater ideals;
- a two-parameter comparison chart;
- nitrate/phosphate ratio presentation;
- an alkalinity/calcium/magnesium relationship view;
- a daily-consumption estimate;
- a health timeline mixing AI alerts and log notes.

These visualizations are useful for exploration, but some wording suggests that
parameters moving together means one influences another. That inference is not
safe without a stronger analytical and evidential contract.

### 3.5 Activity log

The log accepts past, present or future actions under water, dosing, livestock,
health, cleaning and equipment-maintenance categories. An action has title,
category, icon, date, time, optional description and optional photo. Future
actions can be converted into reminders.

Quick actions exist for glass cleaning, skimmer cleaning, filter-media change,
feeding and bacterial dosing. User-created entries may be edited or permanently
deleted. Automatic entries are also produced for account creation, Aquarium
creation, mounting date and Parameter registration.

### 3.6 Routines

Routines support test, maintenance, cleaning, dosing and feeding categories.
Observed recurrence modes were daily, weekly with multiple weekdays, every N
days, monthly on a fixed day, every N months and one-off. A routine may include
the last-performed date, preferred time, advance notice and push delivery.

The agenda separates all, today, overdue and category views. A routine can be
edited, completed or permanently deleted. Templates cover common water changes,
testing, cleaning, consumable replacement, pump service, calibration and source
water work.

### 3.7 CoralBot

The free account exposed three daily energy units. One text request asked only
for a summary of recorded fictitious values and explicitly prohibited purchases
and automatic actions. CoralBot returned the values, but also added a diagnosis
and a two-step plan.

The response asserted excellent stability and correctly compensated consumption
from only three data points. It did not identify a contradiction between the
Aquarium-level dosing method and a Measurement-level dosing label. Its embedded
context represented the recently mounted Aquarium as twelve months old.

The photo flow offers separate intents for coral, pest, fish/invertebrate,
health, algae and test identification. Each image may be up to 15 MB according
to the client. Product cards and live stock suggestions are part of the chat
rendering path, although no product recommendation was requested or opened.

### 3.8 Notifications and account

Settings provide a device-level push switch, management/news preferences and
commercial-interest categories. The notification inbox supports linked entries,
individual deletion and delete-all. Account settings also expose language,
phone, privacy, terms, tour restart, feedback, sign out and account deletion.

### 3.9 Sharing and commerce

The share action shares or copies the Coral Mastery application URL. It does not
share a permission-scoped Aquarium view.

The wish list accepts a type, priority, desired item and notes. Opportunities
provide product categories, search, favourites, live-room state and loyalty
spending. CoralCash is earned through account activity, daily visits,
Measurement recording, streaks, anniversaries and purchases. Commercial and
care behavior are therefore deliberately coupled in Coral Mastery.

### 3.10 Premium tiers

The observed Premium page offered two monthly plans. The audit did not start a
checkout or subscription, so these are current product claims rather than
independently verified entitlements.

`Basic`, advertised at EUR 2.99 per month, included:

- unlimited CoralBot questions instead of the free daily allowance;
- unlimited photo-based test scanning through `Vision Pro`;
- an advanced Parameter diagnostic laboratory;
- the complete Aquarium log;
- a 1.5 multiplier on CoralCash from Flash purchases and daily rewards;
- early access to Flash offers;
- early access to future application features.

`Pro`, advertised at EUR 7.99 per month, included all Basic claims plus:

- a 2x CoralCash multiplier instead of 1.5x;
- a 10% discount on selected Equipment products;
- one free standard shipment per calendar month for orders above EUR 80 in
  mainland Spain;
- an EUR 8 discount instead of free shipping for smaller mainland-Spain orders,
  subject to the stated non-combination conditions.

The page did not advertise additional Aquarium entities, stronger history,
export, backup, scoped collaboration, sensor integration, automation or a more
advanced recurrence model. Basic's care-related differentiation is therefore
mainly increased AI/photo usage and advanced interpretation. Pro's additional
value is predominantly commercial.

For TankOS, the relevant product hypotheses are the underlying user outcomes —
photo evidence, bounded analysis and useful history — not the quota or loyalty
mechanics. Unlimited probabilistic output is not itself a quality improvement,
and commercial priority must not become part of care advice through this plan.

## 4. Defects and product risks observed

| Finding                                                              | Evidence                                                                                                              | Risk if copied into TankOS                           |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Onboarding remains at 4/5 after a stored CoralBot conversation       | The conversation persisted and consumed one free use, but the checklist still showed `Hablar con CoralBot` incomplete | A progress indicator can become false product state |
| Historical values and complete records can be overwritten or deleted | Edit and permanent-delete actions are present in history                                                              | Loss of evidence and correction provenance          |
| Fixed biological ranges drive status                                 | State cards expose product ranges rather than keeper-owned targets                                                    | False universality and unsafe interpretation        |
| Health score and stability formula are opaque                        | Score, trend and stability appear without a complete derivation contract                                              | False precision and difficult defect diagnosis      |
| Comparison language can imply causality                              | Laboratory copy says values move together or influence each other                                                     | Unsupported treatment decisions                     |
| CoralBot exceeds the requested scope                                 | A summary-only request received diagnosis and a plan                                                                  | Loss of user control and instruction fidelity       |
| CoralBot overstates confidence                                       | Three samples yielded excellent stability and compensated-consumption claims                                          | Unsafe advice from insufficient evidence            |
| Assistant context contained incorrect Aquarium age                   | A June 2026 mounting date was represented as twelve months old in August 2026                                         | Advice based on corrupted derived context           |
| Cross-surface dosing data can conflict silently                      | Aquarium setup and Measurement entry carried different dosing methods                                                 | Recommendations may ignore data contradictions      |
| Measurement validity is not clear at entry                           | Most numeric controls lacked native bounds                                                                            | Impossible data may reach interpretation surfaces   |
| Care and commerce are coupled                                        | AI, notifications, loyalty and opportunities can lead to products                                                     | Advice may be biased by conversion goals            |

## 5. Current TankOS baseline

TankOS's current baseline already provides:

- a selected, visible Aquarium context and the `Hoy`, `Agenda`, `Historial` and
  `Acuario` information architecture;
- a global `Registrar` launcher over distinct accepted write use cases;
- immutable Measurements and append-only corrections;
- five canonical Parameters: temperature, salinity, alkalinity, nitrate and
  phosphate;
- optional keeper-owned Parameter Targets and derived Parameter Status;
- bounded Measurement history with filters and traceable corrections;
- qualitative Observations;
- completed Care Work, one-off Planned Care Work and one-weekday weekly Care;
- completed Water Changes with volume and separate occurrence/recording time;
- Equipment and Livestock entities with lifecycle and Aquarium transfers;
- a bounded Timeline read model;
- owner-controlled, permission-scoped read-only guest access;
- accessibility and responsive automated acceptance across supported widths.

Current absences include charts, biological defaults, health scores, structured
Observation categories, image attachments, advanced recurrence, reminders,
notifications and AI. Earlier versions of this plan described those absences
as intentional, unaccepted or deferred. They are now all preserved as proposals
pending user decision in the Product Idea Register.

## 6. Comparative gap

| Capability             | Coral Mastery                                       | TankOS                                                        | Prior agent assessment; not a decision                                      |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Parameter selection    | Broad form with primary and advanced sections       | The same five compile-time Parameters for every Aquarium     | Centralize definitions and let each Aquarium enable and order its subset    |
| Custom Parameters      | No user-defined semantic definition was observed    | Closed product-defined catalogue                             | Discover separately; a free name and Unit are not sufficient                |
| Parameter breadth      | Broad primary and laboratory catalogue              | Five closed Parameters                                       | Adopt incrementally, starting with calcium, magnesium and pH                |
| Entry validation       | Broad form, unclear value bounds                    | Finite, non-negative domain validation and canonical units   | Preserve TankOS validation; add plausibility only after evidence             |
| Parameter targets      | Product-defined ranges                              | Keeper-owned optional intervals                              | Keep TankOS's model; do not copy defaults                                    |
| Historical correction  | Replace and delete                                  | Append-only correction Fact                                  | Keep TankOS's model                                                          |
| Charts                 | Rich time-series and comparison charts              | Filtered tabular history                                     | Add descriptive charts without causal or health claims                      |
| Biological observation | Checklists for algae, pests, water and corals       | Free-text Observation                                        | Add optional structured facets without losing narrative text                |
| Photos                 | Log photos and AI photo intents                     | No attachments                                               | Add evidence attachments before AI analysis                                 |
| Activity shortcuts     | Category cards and quick actions                    | Registrar routes to focused forms                            | Add keeper-configurable shortcuts over existing use cases                   |
| Recurrence             | Daily, multi-weekday, interval, monthly and one-off | One-off and one-weekday weekly                               | Extend Care-specific recurrence after calendar semantics are accepted       |
| Reminders              | Advance notice and push                             | In-app due/upcoming awareness only                           | Add only after consent and delivery semantics are specified                 |
| Equipment maintenance  | Category and routine text                           | Equipment has identity/lifecycle but no service relationship | Relate accepted Care to Equipment without merging aggregates                |
| AI                     | Contextual chat, photo analysis and products        | Future optional capability                                   | Defer until evidence, privacy, evaluation and commercial independence exist |
| Sharing                | Shares app URL                                      | Scoped Aquarium read grants                                  | Keep TankOS's stronger capability                                            |
| Loyalty and shop       | Integrated                                          | Absent                                                       | Do not add through this plan                                                |

## 7. Agent-drafted priority order pending user decision

### Parameter configurability decision

The current five-Parameter catalogue is duplicated as compile-time arrays in
Measurement domain code, shared domain references and UI presentation. This is
safe for the MVP but makes every catalogue addition transversal and makes every
Aquarium display the same entry choices.

“Configurable Parameters” must be split into three different capabilities:

1. **System Parameter definition catalogue.** TankOS owns stable semantic
   definitions such as temperature or alkalinity, their canonical Units and
   compatible input Units. The catalogue may remain code-owned initially, but
   it needs one authoritative boundary rather than duplicated arrays.
2. **Aquarium Parameter profile.** The keeper chooses which system Parameters
   are relevant to one Aquarium and their presentation order. This controls
   recording and current-state surfaces; disabling a Parameter must never
   delete its Measurements or silently remove historical access.
3. **Custom Parameter definitions.** A keeper may eventually define a new
   numeric quantity not yet in TankOS. This is a separate, higher-risk
   capability because identity, Unit meaning, rename/archive behavior,
   targets, sharing, export and historical reconstruction must remain stable.

The agent previously proposed implementing levels 1 and 2 before level 3. That
sequence is preserved as an assessment, not a decision. The user may choose
system definitions, Aquarium profiles or custom definitions in another order;
the unresolved consequences below must then be specified.

The minimum candidate system definition is:

```text
ParameterDefinition
  id                 stable semantic identifier
  quantityKind       semantic quantity, not a display label
  canonicalUnitId    immutable canonical storage Unit
  acceptedUnitIds    bounded compatible input Units
  displayPrecision   presentation metadata
  targetEligible     explicit product capability flag
```

Localized labels remain presentation resources and are not persisted as domain
identity. Biological targets, cadence, alerts and recommendations do not belong
to the definition.

The minimum candidate Aquarium configuration is:

```text
AquariumParameterProfile
  orderedEnabledParameterIds
```

Absence must have an explicit backward-compatible meaning. A safe candidate is
a fixed legacy default containing the original five Parameter IDs, separate
from “all definitions currently known by the product”. This prevents a future
catalogue release from silently enabling calcium or another new Parameter for
every existing Aquarium.

Before custom definitions can be accepted, the specification must decide:

- owner scope versus Aquarium scope;
- stable opaque identity and collision behavior;
- canonical and accepted Units, conversion and precision;
- whether semantic fields become immutable after the first Measurement;
- rename behavior and historical labels;
- archive instead of delete after evidence exists;
- target eligibility and absence of universal interpretation;
- how guests read the definition needed to understand a shared Measurement;
- export/import and restoration of definitions before their Measurements;
- Firestore Rules for references to owned active or archived definitions;
- behavior when a custom definition conflicts with a later system definition.

Do not model a custom Parameter as only `{ name, unit }`. That shape cannot
reliably preserve meaning across history, correction, sharing or import.

### Now: improve evidence capture and review

1. Centralize the system Parameter definitions and add an Aquarium-specific
   enabled/ordered profile.
2. Extend the system catalogue with calcium, magnesium and pH.
3. Add Measurement Sessions, provenance and non-diagnostic data-quality
   feedback.
4. Add descriptive single-Parameter charts over immutable history.
5. Add optional structured Observation facets and Livestock relationships.
6. Relate performed and planned Care to Equipment when useful.
7. Add trustworthy export and backup.

These changes improve ordinary keeper work without depending on background
delivery or probabilistic systems.

### Next: reduce maintenance friction

8. Add safe recording shortcuts over existing use cases.
9. Extend Care-specific recurrence in bounded increments.
10. Add photo evidence with explicit storage and sharing rules.
11. Add personal protocols, incident review and absence preparation after their
    source relationships are accepted.

### Later: background and assisted behavior

12. Add reminder preferences and in-app notification state.
13. Add push delivery only after the in-app model is reliable.
14. Evaluate scoped operational collaboration.
15. Evaluate AI assistance only after a non-AI workflow and an evaluation set
    exist for the same user problem.

### Proposals previously excluded by the agent, restored pending user decision

Every item below remains available for user selection. The list shows where a
choice conflicts with current accepted TankOS documentation and would require
that documentation to be reconsidered:

- health or Aquarium-quality scores;
- universal biological targets;
- destructive Measurement history edits;
- automatic treatment or dosing actions;
- product stock, wish lists, flash sales and loyalty currency;
- engagement streaks that reward Measurement volume over Measurement quality;
- AI product placement inside care advice;
- a generic task or workflow engine.

## 8. Delivery phases

### Phase 0 — Reconcile and accept product decisions

**Status:** candidate.

**Outcome:** produce accepted specifications for only the next chosen vertical
slice. This phase changes no application behavior.

**Required reading:** `VISION.md`, `GLOSSARY.md`, `DOMAIN_RULES.md`,
`CAPABILITY_MAP.md`, the relevant existing specification and this plan.

**Work:**

1. Select exactly one phase from 1 through 20.
2. Write one use-case specification under `.codex/specifications/`.
3. Define actor, value, preconditions, success, failures, authorization,
   history, privacy, offline class and acceptance examples.
4. Update `GLOSSARY.md` or `DOMAIN_RULES.md` only when the accepted use case
   creates durable language or rules.
5. Mark the selected implementation phase `ready` only after the specification
   satisfies `DEFINITION_OF_READY.md`.

**Acceptance:** an implementation agent can answer what is stored, who may do
it, what failure means and how success is observed without inventing a rule.

**Validation:**

```bash
pnpm exec prettier --check .codex/specifications/<specification>.md \
  .codex/product/CORAL_MASTERY_IMPROVEMENT_PLAN.md
git diff --check
```

**Stop if:** two capabilities must be specified together to make the first one
useful. Re-slice the outcome before implementation.

**Suggested commit:** `docs(product): accept <use-case>`.

### Phase 1 — Make Parameters extensible and Aquarium-configurable

**Status:** candidate; requires Phase 0 specification.

**Outcome:** TankOS has one authoritative system Parameter definition boundary,
and a keeper can choose and order the built-in Parameters used by one Aquarium
without altering historical evidence.

**Why first:** adding calcium directly to every compile-time array would expand
the existing duplication without solving the user's actual need for
Aquarium-specific configuration.

**Subphases:**

- **1A — Definition boundary:** centralize stable IDs, quantity meaning,
  canonical Units, compatible Units and target eligibility for the existing
  five system Parameters. Keep definitions code-owned in this subphase.
- **1B — Aquarium profile:** configure the ordered enabled subset for one owned
  Aquarium, with a fixed backward-compatible legacy default.
- **1C — Calcium:** add calcium through the new definition path and allow the
  keeper to enable it deliberately.
- **1D — Custom-definition discovery:** write and evaluate the user-defined
  Parameter specification. Do not implement it merely because 1A uses a
  runtime-looking interface.

**Starting files:**

- `apps/tankos/src/app/measurements/domain/measurement.ts`;
- `apps/tankos/src/app/shared/domain/parameter-reference.ts`;
- `apps/tankos/src/app/shared/ui/parameter-presentation.ts`;
- Aquarium domain/application configuration and Dashboard context;
- Measurement application ports, repository schemas and UI pages;
- Parameter Target and shared-history readers;
- Firestore Aquarium schemas and Rules tests;
- Firestore indexes if current queries require changes.

**Ordered work:**

1. Inventory every current `ParameterId`, Unit and presentation mapping.
2. Define one system catalogue contract without moving UI labels into the
   domain or introducing a generic policy engine.
3. Migrate all exhaustive consumers to that boundary and remove duplicated
   knowledge only after tests prove parity for the five current Parameters.
4. Specify `AquariumParameterProfile`, legacy absence semantics, ordering and
   the effect of disabling a Parameter.
5. Persist only the explicit Aquarium profile through a capability-specific
   operation; do not turn Aquarium into a generic settings document.
6. Filter recording and current-state surfaces by the profile. Historical
   Measurement and correction reads remain available when a Parameter is later
   disabled.
7. Decide how configured targets for a disabled Parameter are presented; never
   delete them as an incidental effect of disabling entry.
8. Add calcium and its accepted canonical Unit through the system catalogue.
9. Preserve `uninterpreted` until the keeper explicitly configures a calcium
   target.
10. Add owner, guest, correction and backward-reconstruction coverage.

**Custom Parameter guardrails:** if 1D is later accepted, use stable definition
IDs and archive definitions after use. A definition referenced by a Measurement
must not be deleted or have its canonical quantity/Unit silently changed.

**Acceptance:** existing Aquariums retain the original five choices; one
Aquarium can enable, disable and order system Parameters without changing
another Aquarium; disabled history remains readable; calcium can be enabled and
then behaves like an existing Parameter end to end; no default range or status
is fabricated.

**Focused validation:** domain/application tests, Angular Measurement tests,
Firestore repository and Rules tests, keeper and shared-history Playwright
journeys.

**Stop if:** legacy-default behavior, disabled-history behavior, the canonical
calcium Unit or custom-definition lifecycle is being inferred rather than
specified.

**Suggested commits:**

- `refactor(measurements): centralize parameter definitions`;
- `feat(aquariums): configure enabled parameters`;
- `feat(measurements): add calcium parameter`.

### Phase 2 — Add magnesium and pH independently

**Status:** candidate; depends on Phase 1.

**Outcome:** magnesium and pH are available through the proven catalogue path.

**Subphases:**

- **2A:** magnesium with its accepted canonical unit and precision;
- **2B:** pH with explicit dimensionless-unit presentation.

Execute and validate 2A before starting 2B. Do not add the Coral Mastery trace
catalogue in this phase.

**Starting files:** the same Parameter mappings and tests changed in Phase 1.

**Acceptance:** each Parameter works through record, correction, latest state,
targets, owner history and permission-scoped guest history.

**Stop if:** pH storage precision or unit semantics are represented as a visual
formatting choice rather than a domain decision.

**Suggested commits:**

- `feat(measurements): add magnesium parameter`;
- `feat(measurements): add ph parameter`.

### Phase 3 — Add a descriptive Parameter chart

**Status:** candidate; may start after Phase 1.

**Outcome:** a keeper can see one selected Parameter over time without losing
table access, unit context, correction traceability or filter meaning.

**Specification questions:** supported time window, maximum points, corrected
Fact presentation, gaps, duplicate timestamps, pagination boundary, target-band
display, timezone and accessibility fallback.

**Starting files:**

- `.codex/specifications/parameter-history.md` or a new focused specification;
- `apps/tankos/src/app/measurements/application/list-parameter-history.ts`;
- `apps/tankos/src/app/measurements/ui/pages/parameter-history-page.*`;
- shared guest history only after the owner chart is accepted;
- `package.json` only if an external chart dependency is proven necessary.

**Ordered work:**

1. Keep the existing history query as the source read.
2. Define a chart-specific view model outside the domain.
3. Render one series and its canonical unit.
4. Retain the accessible table as equivalent content.
5. Show correction relationships deliberately.
6. Add optional keeper target bounds only when configured.
7. Add loading, empty, malformed-data and excessive-density states.
8. Add the guest chart in a separate subphase with the existing
   `permissions.measurements` boundary.

**Do not:** calculate health, smooth away evidence, interpolate missing values,
claim trends or imply causality.

**Acceptance:** the chart answers “how did this recorded Parameter change?” and
the same evidence remains understandable without vision or pointer input.

**Focused validation:** pure view-model tests, component accessibility tests,
history adapter tests and Playwright at 320, 390, 768 and 1280 CSS pixels.

**Stop if:** the proposed chart requires loading unbounded history.

**Suggested commit:** `feat(measurements): chart parameter history`.

### Phase 4 — Add structured Observation facets

**Status:** candidate.

**Outcome:** a keeper can optionally classify a qualitative Observation while
retaining free narrative text.

**Candidate first facet:** `subject` with a deliberately small catalogue such
as Aquarium, water appearance, Livestock or Equipment. Algae, pest, turbidity
and coral-condition vocabularies require their own evidence and should not be
copied wholesale.

**Starting files:**

- `.codex/specifications/record-observation.md`;
- `apps/tankos/src/app/observations/domain/observation.ts`;
- Observation application ports and use cases;
- `apps/tankos/src/app/observations/infrastructure/firestore-observation-repository.ts`;
- Observation record/list UI and Timeline mapping;
- Firestore Rules and malformed-document tests.

**Ordered work:**

1. Accept one optional facet and its vocabulary.
2. Decide backward reconstruction for existing Observations without the facet.
3. Add the facet to the immutable Observation Fact.
4. Validate transport data with Zod before domain mapping.
5. Add an optional, keyboard-accessible UI control.
6. Display the facet without hiding the narrative.
7. Add Timeline presentation only after source behavior works.

**Do not:** infer disease, treatment, severity or Parameter state from a selected
facet.

**Acceptance:** old Observations still load; new Observations may carry the
accepted facet; text remains available and no diagnosis is generated.

**Stop if:** a facet needs a user-extensible taxonomy in the first increment.

**Suggested commit:** `feat(observations): classify observation subject`.

### Phase 5 — Relate Care to Equipment

**Status:** candidate.

**Outcome:** a keeper can record or plan Care for one active Equipment item and
review a trustworthy service history from Equipment and Care surfaces.

**Specification questions:** optional versus required relation, behavior after
Equipment retirement or transfer, historical name snapshot, shared access,
whether Water Change can ever relate to Equipment, and whether service kind is
needed. Candidate service kinds include installation, inspection, cleaning,
calibration, consumable replacement, failure and repair; accept only the kinds
required by a real workflow.

**Starting files:**

- Care Work and Planned Care Work domain/application files;
- Equipment application readers and composition adapters;
- Care recording/planning pages and Equipment detail page;
- Timeline application ports;
- Firestore repositories, indexes and Rules tests.

**Ordered work:**

1. Accept the relationship without merging Equipment and Care aggregates.
2. Add an Aquarium-scoped active Equipment catalogue port for form selection.
3. Reject cross-Aquarium or unauthorized Equipment references.
4. Persist the accepted reference and any required historical snapshot.
5. Render the relation in Care history and Equipment detail.
6. Add an Equipment service timeline as a read model over related Care; do not
   duplicate the source records.
7. Define behavior for later retirement and transfer through tests.
8. Add warranty, purchase or consumable metadata only through separate accepted
   Equipment decisions; do not place those values inside Care descriptions.

**Acceptance:** Care remains valid historical evidence when the Equipment item
later changes lifecycle or Aquarium association.

**Stop if:** the implementation validates authorization only from a selector's
visible options.

**Suggested commit:** `feat(care): relate care work to equipment`.

### Phase 6 — Add safe recording shortcuts

**Status:** candidate; presentation-only after the selected shortcut semantics
already exist.

**Outcome:** common keeper actions start with fewer taps while still use the
existing focused write use cases.

**First increment:** configurable launcher links such as Measurement, Water
Change or a prefilled Care Work description. A shortcut is not a new Fact and
must not save immediately on tap.

**Starting files:**

- `apps/tankos/src/app/shells/private-shell/record-entry-sheet.*`;
- focused recording pages and their route-state handling;
- `apps/tankos/src/app/composition/aquarium-dashboard/`;
- keeper-journey Playwright tests.

**Ordered work:**

1. Select at most three shortcuts backed by accepted use cases.
2. Pass only presentation defaults through navigation state or query input.
3. Require explicit review and submit on the destination form.
4. Preserve success return behavior and duplicate-submit protection.
5. Verify keyboard, screen-reader and 320 px behavior.

**Do not:** create a generic log endpoint or persist a quick action directly.

**Acceptance:** shortcuts reduce navigation but produce exactly the same domain
write and authorization checks as opening the normal form.

**Suggested commit:** `feat(shell): add recording shortcuts`.

### Phase 7 — Extend Care recurrence

**Status:** candidate; divide into separately accepted subphases.

**Outcome:** recurring Care supports more real maintenance cadences without
becoming a generic scheduler.

**Subphase order:**

1. **7A — Multiple weekdays:** one Care plan may schedule selected weekdays at
   one Aquarium-local time.
2. **7B — Every N days:** interval recurrence anchored to one explicit local
   occurrence.
3. **7C — Monthly day:** only after invalid dates and month-length behavior are
   accepted.
4. **7D — Edit and pause:** only after audit/history semantics are accepted.

**Starting files:**

- `apps/tankos/src/app/care/domain/recurring-care-plan.ts`;
- recurrence calculation and application use cases;
- Firestore planned-care repository and Rules;
- recurring creation and Agenda UI;
- deterministic time-zone and DST tests.

**Invariant to preserve:** no recurring plan may create an unbounded backlog.
The current “at most one outstanding occurrence” rule remains unless an
accepted specification replaces it.

**Acceptance:** each subphase has deterministic behavior across DST, overdue
completion, cancellation and application restart.

**Stop if:** implementation starts to introduce generic cron expressions or a
generic `Task` model.

**Suggested commits:** one commit per accepted subphase.

### Phase 8 — Attach photo evidence

**Status:** candidate; requires privacy, cost and retention decisions.

**Outcome:** a keeper may attach a photo as evidence to one accepted record type,
starting with Observation.

**Required decisions:** accepted MIME types, maximum bytes and dimensions,
compression ownership, Storage path, upload state, orphan cleanup, deletion and
retention, correction behavior, guest permission, download authorization,
metadata stripping, offline class and cost bounds.

**Starting areas:**

- new accepted Observation-photo specification;
- Observation application ports and UI;
- a Firebase Storage adapter with runtime response validation;
- Storage Rules and Emulator tests;
- shared-access reads only in a later permission-scoped subphase.

**Ordered work:**

1. Store one optional image for one Observation; do not introduce a generic
   attachment platform.
2. Make record creation and upload failure behavior explicit.
3. Strip or deliberately preserve metadata according to the accepted privacy
   decision.
4. Authorize upload and download independently of UI state.
5. Provide alt text or an accessible textual description policy.
6. Prove orphan cleanup and denied cross-Aquarium access.

**Do not:** add AI analysis in this phase.

**Acceptance:** image evidence cannot weaken Observation durability,
authorization, privacy or recovery.

**Suggested commit:** `feat(observations): attach photo evidence`.

### Phase 9 — Add reminders and notifications

**Status:** candidate; start with in-app state, not push.

**Outcome:** a keeper can request a reminder for accepted Planned Care and
understand delivery, failure, read and dismissal state.

**Subphase order:**

1. **9A — Reminder intent:** Aquarium-local reminder time and consent associated
   with Planned Care.
2. **9B — In-app notification:** durable or derived inbox semantics, read state
   and deep link.
3. **9C — Push delivery:** trusted-device subscription, token rotation,
   revocation, retries, expiry and observability.
4. **9D — Preferences:** per-device and account-level behavior only after their
   precedence is accepted.

**Required decisions:** notification versus reminder language, advance offsets,
timezone changes, duplicate prevention, acknowledgement, cross-device state,
guest behavior, quiet hours, data minimization, provider cost and emulator/CI
strategy.

**Starting areas:** Care specifications and domain, a new notification
application boundary only when justified, Firebase Functions/messaging only in
9C, Settings UI, service worker and PWA E2E.

**Acceptance:** missing or denied push permission never blocks Agenda or Care;
delivery failure remains visible and does not claim the user was notified.

**Stop if:** browser permission is requested before the keeper asks for a
specific reminder.

**Suggested commits:** one commit per subphase.

### Phase 10 — Evaluate AI assistance

**Status:** future; not ready for implementation.

**Outcome:** decide whether one bounded assistant use case provides value over
the non-AI flow without changing domain truth or introducing commercial bias.

**Required prerequisites:**

- reliable source records and permission-scoped retrieval;
- explicit user purpose and consent;
- provenance and citations for knowledge claims;
- a fixed evaluation set including sparse, stale, contradictory and malformed
  Aquarium data;
- instruction-following tests;
- uncertainty and abstention requirements;
- prompt-injection and cross-Aquarium isolation tests;
- retention, deletion, provider and cost policy;
- no product placement inside care advice;
- human confirmation before any write or planned action.

**Candidate first use case:** summarize selected Aquarium evidence with dates,
units, missing-data warnings and links back to source records. The assistant
must not diagnose, prescribe treatment or invent biological targets.

**Evaluation cases derived from this audit:**

1. Three samples must not justify a high-confidence stability claim unless an
   accepted policy explicitly says so.
2. Conflicting dosing methods must be reported as a contradiction, not silently
   reconciled.
3. Aquarium age must be calculated from the accepted establishment or mounting
   evidence with an explicit current instant.
4. A “summary only” instruction must not produce a plan.
5. Missing targets must remain uninterpreted.
6. The assistant must not suggest products when the user prohibits purchases.

**Acceptance:** the candidate passes the evaluation set and remains fully
optional. Failure or quota exhaustion leaves all ordinary TankOS workflows
usable.

**Stop if:** the implementation begins before an accepted privacy and evaluation
specification exists.

**Suggested commit:** no implementation commit until the phase is accepted.

### Phase 11 — Record Measurement Sessions and provenance

**Status:** candidate; depends on the Phase 1 definition boundary.

**Outcome:** a keeper can record several Measurements from one sampling session
with common context while every Measurement remains an independently immutable
Fact.

**Candidate session context:** sampled time, recorded time, optional method or
test-kit reference, optional lot/expiry, sample notes and the created
Measurement IDs. A session groups evidence; it does not become a replacement
Measurement aggregate or rewrite the existing Facts.

**Subphases:**

- **11A — Multi-Parameter entry:** one reviewed submit creates the selected
  Measurements with deterministic partial-failure or atomicity semantics.
- **11B — Provenance:** extend `manual` only for accepted sources such as test
  kit, ICP import, photo reading or device input.
- **11C — Data-quality feedback:** detect duplicate submissions, incompatible
  Units, expired method metadata or implausible values without diagnosing the
  Aquarium.

**Starting files:** Measurement domain/application ports, record page,
Firestore repository, Timeline composition and new focused specifications. Add
a `MeasurementSession` model only if the accepted use case needs durable group
identity; do not create it for UI convenience.

**Ordered work:**

1. Specify grouping identity, atomicity, correction display and backward
   compatibility with existing single-Measurement records.
2. Implement multi-entry application behavior before changing persistence
   shape.
3. Keep provenance explicit and attributable; never infer a sensor or kit from
   a numeric value.
4. Make warnings non-blocking unless the input violates a real domain
   invariant.
5. Show which individual Measurement failed when the accepted write policy is
   not atomic.

**Acceptance:** a sampling session reduces repeated entry, preserves each
Measurement's canonical identity/history and never converts plausibility into a
biological judgement.

**Stop if:** “session” starts to become a generic record container shared by
unrelated domains.

**Suggested commits:** one per accepted subphase.

### Phase 12 — Review Aquarium data consistency

**Status:** candidate; read-only first increment.

**Outcome:** a keeper can find factual contradictions and broken references in
recorded Aquarium data without receiving an automated diagnosis.

**Candidate checks:** incompatible simultaneous dosing configuration,
Planned Care referring to unavailable Equipment, unknown Parameter definitions,
missing reconstruction metadata, orphaned attachment references and duplicated
imports.

**Starting areas:** a composition-owned read model over existing capability
ports, `Acuario` hub navigation and deterministic pure consistency checks.

**Ordered work:**

1. Accept one check whose inputs and contradiction are objectively defined.
2. Implement it as a derived read; do not persist a health state.
3. Link every finding to its source records and an existing safe correction or
   configuration flow.
4. Distinguish `contradiction`, `missing data` and `unable to evaluate`.
5. Add checks one at a time only when they share the same presentation need.

**Acceptance:** every finding is reproducible from displayed source evidence
and disappears only when that evidence/configuration changes.

**Stop if:** a check requires an unstated biological recommendation.

**Suggested commit:** `feat(aquariums): review data consistency`.

### Phase 13 — Link Observations to Livestock

**Status:** candidate; complements Phase 4.

**Outcome:** a keeper can record and review an Observation about one specific
Livestock individual or group.

**Candidate uses:** behavior, feeding response, visible colour, damage,
recovery, acclimation or quarantine notes. These are keeper Observations, not
clinical diagnoses.

**Starting files:** Observation domain/application/repository, Livestock-owned
catalogue adapters, Observation forms/lists, Livestock detail/history, Timeline
and Rules tests.

**Ordered work:**

1. Specify optional relation, Aquarium ownership and behavior after Livestock
   transfer or removal.
2. Reject cross-Aquarium and unauthorized references at application and Rules
   boundaries.
3. Preserve historical identity after lifecycle changes.
4. Show related Observations from Livestock detail without duplicating them.
5. Add photo evidence only through Phase 8.

**Acceptance:** the Observation remains valid and attributable after the
Livestock is transferred or removed, and no health conclusion is generated.

**Stop if:** implementation stores Livestock display text as the only
relationship.

**Suggested commit:** `feat(observations): relate observations to livestock`.

### Phase 14 — Add Water Change context

**Status:** candidate.

**Outcome:** a keeper may add useful optional context to a completed Water
Change while volume and timestamps remain the required immutable evidence.

**Candidate context:** derived percentage of known Aquarium volume, salt or
batch reference, source-water description, new-water temperature/salinity,
declared reason and explicit before/after Measurement links.

**Starting files:** Water Change specification/domain/application/repository,
record/list UI, Aquarium context adapter and Timeline presentation.

**Ordered work:**

1. Accept one optional field or relationship at a time.
2. Decide whether percentage is stored or derived from volume evidence and how
   later Aquarium volume changes affect presentation.
3. Validate linked Measurements belong to the same Aquarium.
4. Present before/after chronology without claiming that the Water Change
   caused the difference.
5. Keep existing Water Changes backward-readable.

**Acceptance:** richer context improves historical review while the original
volume and event time remain unambiguous.

**Stop if:** a missing optional field prevents recording an ordinary Water
Change.

**Suggested commit:** `feat(maintenance): add water change context`.

### Phase 15 — Add personal Care protocols

**Status:** candidate; requires at least one validated repeated procedure.

**Outcome:** a keeper can reuse an Aquarium-owned checklist for a concrete Care
procedure such as a Water Change, skimmer cleaning or probe calibration.

**Boundary:** a protocol is keeper-authored guidance. Executing it may navigate
to accepted recording flows, but checking a box does not silently create a Fact
or perform an action.

**Starting areas:** a focused Care protocol specification, Aquarium-owned
protocol persistence, Agenda/Registrar entry points and accessibility tests.

**Ordered work:**

1. Support one ordered checklist with title and steps.
2. Require explicit confirmation before creating any Care Work.
3. Preserve protocol edits separately from completed historical evidence.
4. Avoid conditions, branching, scripts or generic workflow execution.
5. Add templates only as editable suggestions with clear provenance.

**Acceptance:** the keeper can follow and reuse a procedure without TankOS
claiming that unchecked or background work occurred.

**Stop if:** the design introduces a generic workflow engine.

**Suggested commit:** `feat(care): add personal care protocol`.

### Phase 16 — Add a keeper-started Incident review

**Status:** candidate; depends on linkable source evidence.

**Outcome:** a keeper can manually group relevant Measurements, Observations,
photos, Care Work, Water Changes, Livestock and Equipment while investigating
one declared problem.

**Boundary:** an Incident is opened and closed by the keeper. TankOS does not
detect disease, assign severity or create Incidents from scores.

**Starting areas:** a new accepted Incident specification and domain only after
its identity/lifecycle are justified; composition readers for source links;
`Hoy` and `Historial` navigation.

**Ordered work:**

1. Define title, declared start/close time, owner and source-reference types.
2. Prove all referenced records belong to the same Aquarium and are readable by
   the actor.
3. Keep referenced Facts in their original stores.
4. Present a chronological Incident view with missing/revoked-source states.
5. Close explicitly without deleting or rewriting evidence.

**Acceptance:** the Incident helps investigate a sequence while making it clear
which statements are evidence and which are keeper interpretation.

**Stop if:** Incident becomes a persisted automated health status.

**Suggested commit:** `feat(aquariums): review keeper incident`.

### Phase 17 — Export and restore Aquarium data

**Status:** candidate; export before import/restore.

**Outcome:** an owner can obtain a bounded, documented and portable copy of one
Aquarium's data.

**Subphases:**

- **17A — Measurement CSV:** selected Parameter and period with units,
  timestamps, provenance and correction relationships.
- **17B — Aquarium JSON export:** versioned schema covering accepted owned
  capabilities and explicit omissions.
- **17C — Human-readable report:** optional PDF or print view derived from the
  same export contract.
- **17D — Import/restore:** only after identity remapping, duplicate handling,
  custom Parameter definitions, attachments and rollback are accepted.

**Starting areas:** `.codex/product/DATA_PORTABILITY.md`, capability readers, a
composition export use case and browser download E2E. Keep provider DTOs out of
the export contract.

**Ordered work:**

1. Specify one export schema version and bounded selection.
2. Include canonical units, original entered values where accepted,
   provenance, occurrence/recording time and correction links.
3. State unavailable, excluded and failed sections in the result.
4. Test formula injection and encoding in CSV.
5. Add import only with dry-run validation and recoverable failure semantics.

**Acceptance:** exported data is understandable outside TankOS and preserves the
meaning needed to reconstruct history.

**Stop if:** import is treated as arbitrary Firestore document upload.

**Suggested commit:** `feat(portability): export measurement history`.

### Phase 18 — Make interpretations explainable

**Status:** candidate cross-cutting policy; implement per consumer.

**Outcome:** every derived status, chart or future assistant result exposes the
source evidence and limits behind it.

**Minimum explanation fields:** source record link, measured/recorded time,
canonical Unit, correction state, keeper-owned target when used, number and
period of samples, missing inputs and reason for `uninterpreted` or inability to
evaluate.

**Starting files:** Parameter Status presentation, chart view models from Phase
3, consistency review from Phase 12 and future AI contracts.

**Ordered work:**

1. Add explanation to one existing Parameter Status consumer.
2. Use source models; do not duplicate an interpretation database.
3. Keep accessible text equivalent to visual indicators.
4. Reuse only explanation fields with identical semantics.

**Acceptance:** a keeper can answer “why is this shown?” and navigate to the
evidence without reverse-engineering UI colour or a score.

**Stop if:** explanation copy introduces a biological claim absent from the
calculation.

**Suggested commit:** `feat(measurements): explain parameter status`.

### Phase 19 — Add scoped operational collaboration

**Status:** candidate; depends on the mature read-only grant model.

**Outcome:** an owner may grant another authenticated person narrowly scoped
write permissions such as recording Measurements, completing Care or adding
Observations, while configuration and grant management remain owner-only.

**Required decisions:** collaborator identity, invitation acceptance, exact
write permission set, authorship, revocation, concurrent work, notifications,
audit, correction authority and whether a collaborator may see all history for
the capability they can write.

**Starting areas:** shared-access specifications/application ports, Firestore
Rules, source Fact authorship and independent collaborator shell/journeys.

**Ordered work:**

1. Add one permission and one write use case only.
2. Persist author identity separately from Aquarium owner.
3. Enforce permission in Rules and application boundaries.
4. Prove immediate revocation and denied cross-Aquarium access.
5. Keep sharing/grant mutation owner-only.

**Acceptance:** every collaborator write is attributable and revocation blocks
new writes without rewriting prior Facts.

**Stop if:** a broad `editor` role replaces capability-specific permissions.

**Suggested commit:** `feat(shared-access): delegate measurement recording`.

### Phase 20 — Prepare an Aquarium for keeper absence

**Status:** candidate; composition over accepted Care and collaboration.

**Outcome:** a keeper can prepare a bounded absence plan containing responsible
person, dates, critical Equipment context, feeding/care instructions, planned
work and emergency notes, then review what was actually recorded on return.

**Boundary:** absence preparation does not automatically grant access, send
notifications or claim that planned instructions were completed.

**Starting areas:** a focused absence-plan specification, Agenda composition,
Care protocols, optional collaborator invitation and Timeline review.

**Ordered work:**

1. Start with a read/printable preparation summary over existing plans and
   owner-authored notes.
2. Add responsible-person linking only through accepted collaboration.
3. Link completion to real Care Work rather than checklist appearance.
4. Show uncompleted and unverified instructions explicitly at return.
5. Add reminders only through Phase 9.

**Acceptance:** the owner can hand over understandable instructions and later
distinguish planned, reported and evidenced work.

**Stop if:** emergency contact data lacks explicit privacy and retention rules.

**Suggested commit:** `feat(care): prepare aquarium absence`.

## 9. Cross-phase testing contract

Every accepted implementation phase must choose tests proportionally:

| Boundary changed           | Minimum evidence                                                            |
| -------------------------- | --------------------------------------------------------------------------- |
| Pure domain rule           | Vitest domain examples and invalid-input cases                              |
| Application use case       | Success, authorization/precondition and writer-failure tests                |
| Angular form/read surface  | Spectator/Vitest loading, empty, invalid, failure and success states        |
| Firestore DTO or query     | Emulator integration with malformed-data coverage                           |
| Authorization              | Firestore or Storage Rules tests for owner, guest and unrelated user        |
| Cross-route journey        | Playwright against the supported browser/emulator flow                      |
| Responsive interaction     | 320, 390, 768 and 1280 px checks without horizontal overflow                |
| Background/PWA behavior    | Real service-worker lifecycle E2E; unit stubs are insufficient              |
| Parameter catalogue        | Exhaustive definition/unit mapping and unknown-definition rejection         |
| Aquarium Parameter profile | Legacy absence, independent Aquariums, ordering and disabled-history tests  |
| Export schema              | Golden fixtures, encoding/formula-injection and correction-chain coverage   |
| Delegated write            | Authorship, exact grant, cross-Aquarium denial and immediate revocation E2E |
| AI behavior                | Fixed deterministic evaluation inputs plus provider-boundary contract tests |

Repository-wide checks after a code phase normally include:

```bash
pnpm exec nx lint tankos
pnpm exec nx test tankos --skipNxCache
pnpm exec nx build tankos --configuration=production
pnpm exec nx format:check --base=<actual-base>
git diff --check
```

Use the resolved Nx project configuration to discover the current E2E and
emulator targets rather than copying a stale command from this plan:

```bash
pnpm exec nx show project tankos --json
```

Do not claim a phase complete when a required manual or provider-backed check
was skipped.

## 10. Dependency map

```text
Phase 0: accepted specification for one slice
  |
  +--> Phase 1A: system Parameter definition boundary
  |      +--> Phase 1B: Aquarium Parameter profile
  |      +--> Phase 1C: calcium
  |      +--> Phase 1D: custom-Parameter discovery only
  |      +--> Phase 2A: magnesium
  |      +--> Phase 2B: pH
  |      +--> Phase 3: descriptive chart
  |      +--> Phase 11: Measurement Sessions and provenance
  |             +--> Phase 12: consistency review
  |
  +--> Phase 4: structured Observation
  |      +--> Phase 8: photo evidence
  |      +--> Phase 13: Livestock-related Observations
  |             +--> Phase 10: optional AI evaluation
  |
  +--> Phase 5: Care related to Equipment
  |      +--> Phase 18: explainable derived views
  |
  +--> Phase 6: recording shortcuts
  |
  +--> Phase 7A..7D: recurrence increments
  |      +--> Phase 9A..9D: reminders and notifications
  |
  +--> Phase 14: Water Change context
  |
  +--> Phase 15: personal Care protocols
  |      +--> Phase 16: keeper-started Incident review
  |
  +--> Phase 17A: export
  |      +--> Phase 17B..17D: broader portability and restore
  |
  +--> Phase 19: scoped operational collaboration
         +--> Phase 20: keeper absence preparation
```

Phases 1, 4, 5, 6, 7, 14, 15, 17 and 19 may be discovered independently after
Phase 0 has accepted the specific slice. Phase 10 depends on trustworthy inputs
from the earlier evidence phases but is never required for their use.

## 11. Agent-drafted first delivery sequence pending user decision

The agent previously proposed this sequence based on implementation risk. It is
not accepted priority or scope:

1. Centralize the five existing system Parameter definitions without changing
   behavior.
2. Specify and implement the Aquarium-specific enabled/ordered Parameter
   profile with a fixed legacy default.
3. Add calcium through that new path.
4. Add multi-Parameter entry and explicit provenance in separate subphases.
5. Add a single-Parameter owner chart.
6. Add magnesium and then pH independently.
7. Specify one optional Observation subject or Livestock relationship.
8. Relate Care to Equipment and expose its service history.
9. Export Measurement history.
10. Validate demand before beginning custom Parameters, recurrence, photos,
    collaboration or notifications.

The agent's rationale was that this order could expand everyday value while
keeping each change small and avoid starting with higher-cost infrastructure
or less predictable behavior. The user has not accepted that rationale or
sequence.

## 12. Per-phase completion record

Append one entry after each completed phase:

```text
Phase:
Status: complete | partial | blocked
Accepted specification:
Commit:
Implemented scope:
Files:
Automated validation:
Manual validation:
Items not included in that phase, without implying rejection or priority:
Known risks:
Next phase:
```

Do not mark a phase complete merely because it compiles. A candidate phase with
no accepted specification remains pending even when exploratory code exists.

## 13. Agent-drafted candidate definition of success

This improvement programme succeeds when:

- a keeper records and understands more relevant evidence with less friction;
- each Aquarium can select and order relevant system Parameters without
  deleting disabled history or silently enabling future catalogue additions;
- any accepted custom Parameter has stable identity, Unit meaning, archival and
  portable historical reconstruction;
- new Parameters retain canonical units, validation and immutable correction;
- Measurement Sessions and provenance add context without replacing individual
  Measurement Facts;
- charts expose source history without fabricating diagnosis or causality;
- Observations become easier to classify without losing narrative context;
- Livestock-related Observations remain valid across lifecycle changes;
- Equipment maintenance is traceable without merging aggregates or duplicating
  Care history;
- Water Change context remains optional and does not imply causality;
- export preserves units, provenance, timestamps and correction relationships;
- personal protocols and Incident review distinguish instructions,
  interpretations and completed evidence;
- recurrence remains Aquarium-local, bounded and deterministic;
- reminders are consented, observable and non-blocking;
- photos are private, authorized, recoverable and cost-bounded;
- collaboration is capability-scoped, attributable and immediately revocable;
- absence preparation distinguishes planned, reported and evidenced work;
- any future AI reports uncertainty, cites sources, follows user constraints and
  never silently changes Aquarium truth;
- TankOS remains useful without commerce, engagement rewards, AI or background
  delivery.
