# UX Implementation Path

**Status:** accepted implementation path.

This document turns TankOS's product principles into a sequence of small,
verifiable UX increments. It is intentionally explicit so that an agent with
limited repository context or weaker planning ability can implement one step at
a time without redefining the product, domain model or persistence.

It complements, and does not replace:

- [`../VISION.md`](../VISION.md);
- [`MENTAL_MODEL.md`](MENTAL_MODEL.md);
- [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md);
- [`UX_PHILOSOPHY.md`](UX_PHILOSOPHY.md);
- [`USER_JOURNEYS.md`](USER_JOURNEYS.md);
- accepted use-case specifications under [`../specifications/`](../specifications/);
- [`../DEFINITION_OF_READY.md`](../DEFINITION_OF_READY.md) and
  [`../DEFINITION_OF_DONE.md`](../DEFINITION_OF_DONE.md).

## 1. Outcome

TankOS must feel like one coherent mobile-first aquarium-care product, not a
collection of independently testable capabilities.

The target experience helps a keeper answer four recurring questions:

1. **Hoy:** what needs attention and what is the latest relevant context?
2. **Agenda:** what care is due, upcoming or recurring?
3. **Historial:** what was observed, measured or done?
4. **Acuario:** what living organisms, equipment and configuration belong to
   the active Aquarium?

The global **Registrar** action provides a short route to recording an
Observation, Measurement, completed Care Work or Water Change.

This path does not authorize new domain behavior. It reorganizes and improves
the presentation of behavior already accepted and implemented. If a phase
requires a capability that is still deferred, stop and create or accept the
relevant product specification before implementing it.

## 2. Non-negotiable constraints

Every implementation phase must preserve these boundaries:

- TankOS is the product; an `Aquarium` is the active care context.
- The active Aquarium must be visible whenever a keeper can read or write
  Aquarium-owned information.
- Firestore Rules remain the authorization boundary. Navigation state and
  hidden controls do not grant access.
- Existing domain models, use cases, repositories and Firestore collections
  must not be merged merely to simplify navigation.
- Timeline remains a read model, not a new source of truth.
- Measurement history remains immutable and corrections remain append-only.
- Shared guest access remains read-only and permission-scoped.
- Product-facing text is Spanish. Code, filenames and technical documentation
  are English.
- Angular Material 3 and its theme tokens are the UI foundation.
- Do not add a UI library, icon library, state library, Storybook, design-token
  package or responsive-layout dependency unless a later accepted need proves
  it necessary.
- Do not create Nx libraries for presentation grouping. Keep the current single
  application until a real ownership or reuse boundary justifies extraction.
- Do not add health scores, biological defaults, alerts, reminders,
  recommendations, trend interpretation or automation through a UX change.
- Keep every phase independently reviewable, testable and reversible.

## 3. How an implementation agent must use this document

An agent must implement exactly one numbered phase, or one explicitly named
subphase, per task unless the user authorizes a broader scope.

Before editing:

1. Read [`.codex/AGENT.md`](../AGENT.md).
2. Read this document completely.
3. Read only the product documents and specifications named by the selected
   phase.
4. Run `git status --short --branch` and preserve unrelated changes.
5. Inspect the current files listed by the phase; do not assume this document's
   snapshot is still current.
6. Confirm that the phase does not require a deferred domain decision.
7. Provide the standard pre-implementation summary from `AGENT.md`.

During implementation:

- Preserve existing route URLs unless the phase explicitly authorizes a route
  addition or redirect.
- Prefer composition pages that link existing use cases over duplicated data
  fetching.
- Use semantic HTML first and Material components where they improve the
  interaction.
- Verify that the chosen Material component exists in the installed Angular
  Material version. Do not invent component selectors from the platform-neutral
  Material Design guidance.
- Reuse Material system tokens before adding literal colors, typography,
  elevation, shape or spacing values.
- Keep compact layouts usable at 320 CSS pixels without horizontal scrolling.
- Keep touch targets, focus order, labels, status announcements and errors
  accessible.
- Update tests for TankOS behavior, not Material's internal DOM.

Before finishing:

1. Run the focused tests named by the phase.
2. Run `pnpm exec nx lint tankos`.
3. Run `pnpm exec nx test tankos --skipNxCache`.
4. Run a production build when routes, shell composition, lazy loading or
   budgets changed.
5. Run the relevant Playwright journey when navigation or a cross-route flow
   changed.
6. Run `pnpm exec nx format:check --base=<actual-base>` and
   `git diff --check`.
7. Review the complete diff and report any deferred item or unverified manual
   check.

Do not mark a phase complete merely because it compiles.

## 4. Target journeys

### 4.1 First use

```text
Access private area
  -> no Aquarium exists
  -> establish Aquarium with its name
  -> enter Hoy for the new Aquarium
  -> show optional setup guidance in context
```

Rules:

- Aquarium name is the only initial requirement already accepted.
- Do not force location, timezone, Parameter Targets, Livestock or Equipment
  into initial creation.
- Ask for timezone when calendar-based Care makes it relevant.
- Ask for location when Local Weather makes it relevant.
- Ask for Parameter Targets when the keeper wants interpreted Parameter Status.
- Setup guidance must be dismissible by navigation and must not fabricate a
  completion percentage unless a real persisted checklist is accepted.

### 4.2 Returning keeper

```text
Open private area
  -> restore the last authorized active Aquarium
  -> enter Hoy
  -> review attention items and latest context
```

If the stored Aquarium is missing or unauthorized, fail closed and send the
keeper to the Aquarium selector with a clear explanation.

### 4.3 Daily care

```text
Hoy
  -> review overdue/upcoming Care
  -> complete a planned item or choose Registrar
  -> record the action
  -> receive concise confirmation
  -> return to the originating context
  -> see the updated information
```

Do not make the keeper return to `Mis acuarios` after every successful action.

### 4.4 Record evidence or work

```text
Registrar
  -> choose Observación | Medición | Cuidado realizado | Cambio de agua
  -> open the existing focused form
  -> save once
  -> show success and a safe next action
```

The launcher is navigation, not a new generic record domain. Each option keeps
its existing use case, route, validation, persistence and authorization.

### 4.5 Plan and perform Care

```text
Agenda
  -> see overdue before upcoming work
  -> complete or cancel a concrete planned item
  -> optionally create a one-time or weekly plan
  -> remain in Agenda with refreshed state
```

Do not introduce monthly recurrence, multiple weekdays, pause, reminders or
notifications through this flow.

### 4.6 Review history

```text
Historial
  -> review recent cross-capability activity
  -> navigate to a focused history when needed
  -> inspect Measurements, Observations, Care or Water Changes
```

Until complete Timeline filters are accepted, presentation controls may only
navigate to existing focused histories. They must not imply a unified filtered
query that does not exist.

### 4.7 Manage the Aquarium

```text
Acuario
  -> review Aquarium identity and setup
  -> open Habitantes or Equipos
  -> configure targets, location or timezone when relevant
  -> manage sharing
  -> switch Aquarium deliberately when needed
```

`Livestock` must be presented to users as **Habitantes** or **Seres vivos**.
`Equipment` must be presented as **Equipos**. Technical identifiers remain
unchanged.

### 4.8 Switch Aquarium

```text
Tap active Aquarium in the app bar
  -> open Aquarium selector
  -> choose another owned Aquarium
  -> validate ownership
  -> enter Hoy for the selected Aquarium
```

Switching must never carry stale Aquarium data into the newly active context.

### 4.9 Shared guest

```text
Accept invitation
  -> open shared Aquarium summary
  -> see only granted categories
  -> inspect read-only records
  -> lose subsequent access immediately after revocation
```

The private keeper navigation must not be shown as if the guest owned the
Aquarium. Shared access has its own simple read-only shell or route context.

## 5. Target information architecture

### 5.1 Primary destinations

| Destination | Existing foundation           | Target responsibility                                            |
| ----------- | ----------------------------- | ---------------------------------------------------------------- |
| `Hoy`       | `/app/aquariums/current`      | Attention, current Measurements, recent activity, nearby actions |
| `Agenda`    | `/app/aquariums/care/planned` | Due/upcoming Care and plan entry points                          |
| `Historial` | `/app/aquariums/timeline`     | Recent Timeline plus navigation to focused histories             |
| `Acuario`   | new composition landing route | Identity, Habitantes, Equipos, settings and sharing              |

The recommended Aquarium landing route is `/app/aquariums/manage`. It is a
composition page over existing capabilities, not a new domain capability.

### 5.2 Secondary routes

Keep these existing routes as focused destinations:

- `/app/aquariums` — owned Aquarium selector;
- `/app/aquariums/new` — establish Aquarium;
- `/app/aquariums/observations` and `/new`;
- `/app/aquariums/measurements`, `/history`, `/new` and correction routes;
- `/app/aquariums/care`, `/care/new`, `/care/planned/new` and
  `/care/recurring/new`;
- `/app/aquariums/maintenance` and `/maintenance/new`;
- `/app/aquariums/livestock` and its focused routes;
- `/app/aquariums/equipment` and its focused routes;
- `/app/aquariums/parameter-targets`, `/timezone`, `/location` and `/access`.

Route renaming is not required to improve user-facing language.

### 5.3 Adaptive navigation

Use the same four destinations at every viewport size:

- compact, `0-599px`: bottom navigation plus a global Registrar FAB;
- medium, `600-839px`: navigation rail plus FAB;
- expanded, `840px` and above: persistent or standard navigation drawer, with
  labels, plus the content surface.

The exact CSS implementation may use media queries. Do not add Angular CDK
Layout solely for these three stable presentation ranges.

The top app bar provides:

- current page title;
- active Aquarium name when Aquarium context exists;
- back navigation on secondary/form/detail routes;
- an overflow or account destination for low-frequency global actions.

Do not place `Mis acuarios`, `Compartir acuario`, `Área pública` and every
feature action as simultaneous text buttons in the compact top bar.

### 5.4 Global Registrar action

On the four top-level keeper destinations, show one extended or regular FAB
labelled `Registrar`. Activating it opens a Material bottom sheet or equivalent
accessible action surface with:

- `Observación`;
- `Medición`;
- `Cuidado realizado`;
- `Cambio de agua`.

Hide the FAB on focused forms, correction flows, detail pages and destructive
confirmation states. The launcher must navigate to existing routes and must
not save data itself.

## 6. Delivery sequence

The phases below are ordered. A later phase may begin only when all acceptance
criteria of the previous phase pass or when the user explicitly records why it
is safe to proceed out of order.

### Phase 0 — Reconcile product documentation

**Objective:** make the documented journeys match the implemented product
before changing the shell.

**Read:**

- `product/USER_JOURNEYS.md`;
- `product/PERSONAS.md`;
- `product/CAPABILITY_MAP.md`;
- `ROADMAP.md`;
- accepted specifications for sharing, Livestock, Equipment, Water Change and
  Parameter History.

**Inspect:** current routes, E2E journeys and `git log` for implemented slices.

**Changes:**

1. Update stale journey statements such as selection not rendering a Dashboard.
2. Mark implemented capabilities as implemented where repository evidence
   confirms them.
3. Record the delegated authenticated guest as supported only to the extent
   already implemented.
4. Add the target journeys from section 4 without turning screen structure into
   domain rules.
5. Keep deferred decisions explicit.

**Do not:** change application code, Firestore, permissions or domain rules.

**Acceptance:** product documents no longer contradict routes, tests or current
behavior; all new statements point to accepted specifications.

**Validation:** Markdown links, formatting and `git diff --check`.

**Suggested commit:** `docs(product): align journeys with current experience`

### Phase 1 — Define the navigation contract

**Objective:** make page hierarchy and destination metadata explicit before
rendering new navigation.

**Likely files:**

- `apps/tankos/src/app/app.routes.ts`;
- a small route-presentation model under `shells/private-shell/`;
- `apps/tankos/src/app/app.routes.spec.ts`;
- `apps/tankos/src/app/shells/private-shell/private-shell.spec.ts`.

**Changes:**

1. Classify routes as top-level, secondary, form, detail or external/shared.
2. Add route data only when the shell needs a title, active destination or FAB
   visibility decision.
3. Define the four primary destinations in one presentation-level constant.
4. Add `/app/aquariums/manage` as a lazy composition route with a temporary
   minimal landing component if needed.
5. Make `/app` redirect safely to `/app/aquariums/current`; the existing
   no-context behavior must still lead to Aquarium selection.

**Do not:** move domain code, rename existing routes or build the final visual
shell in this phase.

**Acceptance:** every private route has a deliberate shell classification; the
active destination can be derived without string matching scattered across
templates; deep links still work.

**Validation:** route unit tests, private-shell tests, lint, unit suite and
production build.

**Suggested commit:** `refactor(navigation): define keeper route hierarchy`

### Phase 2 — Build the adaptive private shell

**Objective:** replace the test-oriented toolbar and static page heading with a
mobile-first Material shell.

**Likely files:**

- `shells/private-shell/private-shell.ts`;
- `shells/private-shell/private-shell.html`;
- `shells/private-shell/private-shell.css`;
- new small shell-only navigation components if the template becomes hard to
  read;
- shell and route tests.

**Changes:**

1. Render a contextual top app bar.
2. Show page title and active Aquarium name.
3. Add compact bottom navigation for `Hoy`, `Agenda`, `Historial`, `Acuario`.
4. Add medium navigation rail and expanded navigation drawer using the same
   destination model.
5. Use `aria-current="page"` for the selected destination.
6. Keep keyboard order logical when navigation moves visually.
7. Reserve content padding so the bottom navigation and FAB do not cover the
   final interactive content.
8. Move low-frequency global links out of the compact toolbar.

**Do not:** redesign Dashboard sections or feature forms yet.

**Acceptance:**

- no horizontal navigation overflow at 320px;
- all four destinations are reachable with touch and keyboard;
- the current destination is textually and semantically identifiable;
- the active Aquarium is visible on every Aquarium-scoped private page;
- desktop and mobile expose the same destinations;
- browser refresh and deep links preserve the correct shell state.

**Validation:** Spectator shell tests, route tests, production build budget,
Playwright navigation smoke at compact and expanded viewports, manual keyboard
and 200% zoom check.

**Suggested commit:** `feat(navigation): add adaptive keeper shell`

### Phase 3 — Add the Registrar launcher

**Objective:** provide one predictable global entry point for frequent logging.

**Likely files:**

- shell template and component;
- a `record-entry-sheet` shell UI component;
- shell tests;
- keeper Playwright journey.

**Changes:**

1. Add a Material FAB labelled `Registrar` on top-level destinations.
2. Open an accessible Material bottom sheet if supported by the installed
   Angular Material version.
3. List the four existing recording choices with clear Spanish labels and
   optional supporting descriptions.
4. Navigate to existing routes.
5. Restore focus to the launcher if the sheet is dismissed.
6. Hide the launcher when there is no active Aquarium or on non-top-level
   routes.

**Do not:** create a generic record model, combined form or new persistence.

**Acceptance:** the keeper can reach each existing recording form in at most two
actions from any top-level destination; cancelling changes nothing; assistive
technology receives the sheet title and options.

**Validation:** component tests plus a compact Playwright flow for open, dismiss
and navigation.

**Suggested commit:** `feat(navigation): add global record launcher`

### Phase 4 — Transform Dashboard into Hoy

**Objective:** turn the existing Dashboard into the daily operational home.

**Likely files:**

- `composition/aquarium-dashboard/aquarium-dashboard-page.*`;
- existing preview/section templates and styles;
- Dashboard and preview tests.

**Required order on compact screens:**

1. Aquarium identity and only setup gaps that currently affect value.
2. `Necesita atención`: overdue and nearest planned Care.
3. `Últimas mediciones`: latest value, age, target and derived status.
4. `Actividad reciente`.
5. Local Weather as secondary context when configured.

**Changes:**

1. Present the page as `Hoy`, not `Dashboard del acuario`.
2. Remove the large `Configurar`, `Registrar` and `Consultar` link dump.
3. Keep one contextual action per section and rely on primary navigation plus
   the Registrar launcher for the rest.
4. Keep loading, empty, partial failure and retry states local to each section.
5. Ensure status text never implies health or safety.

**Do not:** add scores, charts, freshness thresholds, alerts or recommendations.

**Acceptance:** the first compact viewport communicates Aquarium, attention and
latest evidence without requiring the keeper to parse a capability menu; every
removed action remains reachable through the new navigation.

**Validation:** Dashboard/section tests, keeper E2E and manual 320px/200% zoom
review.

**Suggested commit:** `feat(dashboard): reshape aquarium home around today`

### Phase 5 — Make Aquarium selection a contextual switcher

**Objective:** keep multi-Aquarium management available without making it the
home screen for every action.

**Likely files:**

- `aquarium-management/ui/pages/list-my-aquariums-page.*`;
- private shell app bar;
- selection tests and keeper E2E.

**Changes:**

1. Make each Aquarium row/card open that Aquarium directly after successful
   selection.
2. Remove the split interaction where an active row does nothing but a separate
   `Abrir acuario seleccionado` button is required.
3. Open the selector from the active Aquarium control in the app bar.
4. After switching, navigate to `Hoy` and reload every active-context consumer.
5. Preserve clear creation access from the selector.

**Do not:** infer cross-Aquarium authorization from UI state or preload all
Aquarium histories.

**Acceptance:** selecting any authorized Aquarium is one clear action; the new
Aquarium name and data replace the old context without stale content.

**Validation:** selection unit tests and Playwright with two independent
Aquariums.

**Suggested commit:** `feat(aquariums): simplify contextual switching`

### Phase 6 — Make Agenda the Care work surface

**Objective:** organize intended future work around what the keeper needs to do.

**Likely files:**

- `care/ui/pages/list-planned-care-work-page.*`;
- `care/ui/previews/upcoming-care-preview.*`;
- Care tests and keeper E2E.

**Changes:**

1. Present `Agenda` as the page title.
2. Put overdue items before upcoming items using the already accepted timing
   policy.
3. Keep complete, cancel and stop-recurrence actions on the relevant item.
4. Give `Planificar cuidado` one primary position.
5. Put weekly recurrence creation behind a secondary action.
6. Refresh the list after completion/cancellation and keep the keeper in Agenda.
7. Remove any duplicate error rendering.

**Do not:** alter recurrence rules, add reminders or merge completed Care Work
into Planned Care Work.

**Acceptance:** a keeper can identify the next required action, complete it and
confirm its disappearance without leaving Agenda.

**Validation:** deterministic-time component tests, Care application tests and
the relevant Playwright flow.

**Suggested commit:** `feat(care): organize planned work as agenda`

### Phase 7 — Make Historial a useful entry point

**Objective:** provide a coherent history starting point without pretending a
universal filtered Timeline exists.

**Likely files:**

- `timeline/ui/pages/review-recent-timeline-page.*`;
- Timeline preview/page tests;
- links to focused existing histories.

**Changes:**

1. Present `Historial` as the page title.
2. Keep the existing bounded recent Timeline as the default content.
3. Add clearly labelled navigation to Measurements, Observations, completed
   Care, Water Changes and Livestock history where implemented.
4. Use navigation tabs/chips only if they represent navigation, with links and
   route state; do not present them as server-side filters.
5. Preserve event type, effective time and Aquarium-local presentation.

**Do not:** add complete Timeline pagination, materialization or unaccepted
filters.

**Acceptance:** the keeper can answer “what happened recently?” and reach each
focused history without returning to `Mis acuarios`.

**Validation:** Timeline tests, link/route tests and keeper E2E.

**Suggested commit:** `feat(timeline): establish history entry point`

### Phase 8 — Build the Acuario hub

**Objective:** group low-frequency Aquarium structure and configuration in one
discoverable composition page.

**Likely files:**

- a new page under `composition/aquarium-management/` or another existing
  composition-owned location consistent with current architecture;
- `app.routes.ts`;
- route/page tests.

**Sections:**

- Aquarium identity and switch action;
- `Habitantes` -> existing Livestock list;
- `Equipos` -> existing Equipment list;
- `Parámetros y objetivos` -> existing targets page;
- `Ubicación y zona horaria` -> existing focused pages;
- `Compartir acceso` -> existing access-management page.

**Changes:** create a navigation hub using current read models or links. Only
show summaries when an existing bounded reader can provide them without new
domain behavior or expensive fan-out reads.

**Do not:** create a new Aquarium aggregate DTO containing all capabilities or
load every collection to render the hub.

**Acceptance:** all structural and configuration capabilities are reachable
from `Acuario`; daily logging is not duplicated there; the page remains useful
when optional setup is absent.

**Validation:** route/page tests, ESLint Boundaries, production build and compact
Playwright navigation.

**Suggested commit:** `feat(aquariums): add aquarium management hub`

### Phase 9 — Normalize recording forms and return behavior

**Objective:** make all frequent recording flows feel like one product while
preserving separate use cases.

**Affected forms:** Observation, Measurement, completed Care Work and Water
Change. Correction remains a deliberately distinct Measurement flow.

**Changes:**

1. Use a focused page with contextual top app bar instead of nesting every form
   inside a decorative card on compact screens.
2. Keep a single-column field order.
3. Pre-fill current date/time only where current behavior already accepts it.
4. Keep one primary submit action and one cancel/back action.
5. Use consistent saving, error and success language.
6. After success, show a Material snackbar or inline announced confirmation and
   return to the invoking destination or `Hoy`.
7. Ensure repeat-entry is explicit rather than accidental double submission.
8. Keep correction messaging visible: the original Measurement remains.

**Do not:** build a generic dynamic form, generic record command or silent
optimistic write.

**Acceptance:** every form is usable at 320px, has visible labels and errors,
prevents duplicate submission and has a predictable post-save destination.

**Validation:** all affected Spectator tests and the canonical keeper E2E.

**Suggested commit:** `refactor(forms): unify aquarium recording experience`

### Phase 10 — Normalize lists, details and pagination

**Objective:** remove test-oriented list mechanics and establish consistent
mobile scanning.

**Affected areas:** Measurements, Observations, completed Care, Water Changes,
Habitantes, Equipos and focused histories.

**Changes:**

1. Use one primary action in each page heading.
2. Prefer semantic lists and compact rows for repeated records; use cards only
   when grouping or elevation adds meaning.
3. Present type, value/title and time in a stable hierarchy.
4. Move rare item actions to a contextual menu when direct buttons create
   crowding, while keeping destructive intent explicit.
5. Replace the visible page-size selector on compact screens with `Cargar más`.
   Preserve bounded repository page sizes and opaque cursors internally.
6. Keep focused histories linked back to `Historial` or their parent surface,
   not generically to `Mis acuarios`.
7. Replace user-facing `Livestock` and `Equipment` with `Habitantes`/`Seres
vivos` and `Equipos`.

**Do not:** change pagination query semantics, record ordering or lifecycle
rules.

**Acceptance:** lists do not overflow at 320px; actions remain reachable by
keyboard; loading more appends without losing scroll context; terminology is
Spanish and consistent.

**Validation:** list component tests, pagination tests, security-pagination E2E
and manual screen-reader landmark review.

**Suggested commit:** `refactor(ui): normalize aquarium lists and histories`

### Phase 11 — Add progressive setup guidance

**Objective:** help a new keeper obtain value without a mandatory setup wizard.

**Likely files:** Hoy Dashboard composition and existing configuration links.

**Changes:**

1. After Aquarium establishment, navigate to `Hoy`.
2. When timezone is absent, explain that it is needed for local Care scheduling.
3. When location is absent, explain that it enables Local Weather.
4. When no Parameter Targets exist, offer configuration from the Measurements
   section without implying that targets are required.
5. When no Habitantes or Equipos exist, expose those entry points in the Acuario
   hub, not as urgent Dashboard alerts.

**Do not:** persist checklist state, infer setup completeness or block ordinary
recording.

**Acceptance:** a new keeper can create an Aquarium and record useful evidence
immediately; optional configuration is understandable and contextual.

**Validation:** first-use component and Playwright journey.

**Suggested commit:** `feat(onboarding): add progressive aquarium setup guidance`

### Phase 12 — Refine shared guest UX

**Objective:** give delegated guests a coherent read-only experience separate
from the owner shell.

**Likely files:** `shared-access/ui/`, shared lazy routes and E2E.

**Changes:**

1. Add a minimal contextual app bar with Aquarium name and read-only wording.
2. Present only categories present in the active grant.
3. Keep Measurement History navigation visible only with `measurements`.
4. Remove owner language and all write affordances.
5. Preserve detailed permission errors and revocation behavior.

**Do not:** reuse the owner bottom navigation, cache access after revocation or
add collaboration roles beyond accepted grants.

**Acceptance:** the guest understands which Aquarium is shared, what can be
read, that access is read-only and why access disappeared after revocation.

**Validation:** invitation/read/revocation Playwright flow and production build
to protect lazy-loading budgets.

**Suggested commit:** `refactor(shared-access): clarify read-only guest journey`

### Phase 13 — Accessibility and responsive acceptance pass

**Objective:** verify the complete experience as a product rather than relying
only on isolated component tests.

**Required viewports:**

- 320 x 568 compact phone;
- 390 x 844 representative phone;
- 768 x 1024 medium/tablet;
- 1280 x 800 expanded desktop.

**Required checks:**

- keyboard-only navigation;
- visible focus;
- landmarks and heading hierarchy;
- accessible names for icon-only controls;
- `aria-current` for navigation;
- announced loading, success and error states;
- 200% browser zoom without lost actions or horizontal page scrolling;
- touch-target spacing;
- reduced-motion behavior;
- long Aquarium names and long Spanish labels;
- empty, loading, failure, partial-failure and populated states;
- active Aquarium switching with no stale content;
- guest revocation;
- direct deep-link refresh.

Fix defects in the owning component. Do not create a broad accessibility utility
layer unless repeated semantics prove it necessary.

**Acceptance:** WCAG 2.2 AA baseline from `UX_PHILOSOPHY.md` is met for the
implemented journeys, and all critical paths are usable at every required
viewport.

**Validation:** full lint, unit, production build, Firebase Emulator integration
and Playwright suites, plus recorded manual checks.

**Suggested commit:** `fix(ui): close responsive and accessibility gaps`

### Phase 14 — Visual consolidation

**Objective:** refine hierarchy and consistency only after the flows are stable.

**Changes:**

1. Audit repeated spacing, headings, feedback states and content widths.
2. Consolidate only tokens or styles whose semantics are demonstrably shared.
3. Use Material theme tokens for color, typography, shape and elevation.
4. Keep color semantic and never the sole carrier of status.
5. Add icons only where they improve recognition; keep accessible labels.
6. Keep light mode only until dark mode is separately accepted.

**Do not:** introduce a design-system package, Storybook or visual-regression
infrastructure solely for cleanup.

**Acceptance:** top-level destinations, forms, lists and feedback states have a
recognizable shared hierarchy without erasing feature-specific meaning.

**Validation:** full UI validation plus manual cross-page comparison.

**Suggested commit:** `refactor(ui): consolidate material presentation`

## 7. Phase dependency map

```text
0 Documentation truth
  -> 1 Route/navigation contract
    -> 2 Adaptive shell
      -> 3 Registrar launcher
      -> 4 Hoy
      -> 5 Aquarium switcher
      -> 6 Agenda
      -> 7 Historial
      -> 8 Acuario hub
        -> 9 Recording forms
        -> 10 Lists and pagination
        -> 11 Progressive setup
        -> 12 Shared guest UX
          -> 13 Accessibility/responsive acceptance
            -> 14 Visual consolidation
```

Phases 4 through 8 may be developed independently after phases 1 and 2, but
they should be integrated one at a time. Phase 13 must run after all accepted
experience changes are present.

## 8. Per-phase completion record

For every completed phase, append a short entry to this section or to a linked
execution log if this document becomes too large:

```text
Phase:
Status: complete | partial | blocked
Commit:
Implemented scope:
Files:
Automated validation:
Manual validation:
Deferred items:
Known risks:
Next phase:
```

Phase: 10 — Normalize lists, details and pagination
Status: complete
Commit: — (working tree)
Implemented scope: Spanish terminology for Habitantes/Equipos, one primary
heading action on the main record lists, contextual return links for focused
history surfaces, and compact pagination that exposes Cargar más without
changing repository page sizes, cursors, ordering or query semantics.
Files: shared pagination styles plus Equipment, Livestock, Measurements and
Observations list/detail/transfer templates.
Automated validation: 75 unit-test files and 311 tests passed; architecture,
lint, format check, diff check, production build and 11 security-pagination E2E
tests passed.
Manual validation: compact behavior was reviewed in the templates and CSS;
screen-reader landmark review remains deferred to the dedicated accessibility
phase.
Deferred items: contextual menus for rare row actions and the full responsive
screen-reader acceptance pass.
Known risks: the page-size select remains available at non-compact widths and
the existing test IDs stay English for automation stability.
Next phase: 11 — Progressive setup.

Phase: 11 — Add progressive setup guidance
Status: complete
Commit: — (working tree)
Implemented scope: new Aquarium creation selects the new Aquarium and routes
directly to Hoy; Hoy explains why timezone and location are useful; missing
parameter targets receive optional guidance from Measurements; no alerts were
added for missing Habitantes or Equipos.
Files: establishment page and test, dashboard store/page and test, current
Measurements section and test, and the keeper/maintenance Playwright journeys.
Automated validation: 75 unit-test files and 311 tests passed; architecture,
lint, format check, diff check, production build and 3 keeper-journey E2E tests
passed.
Manual validation: first-use and progressive guidance were reviewed through
the component templates and the real Playwright journey.
Deferred items: the full accessibility/responsive acceptance pass remains in
Phase 13.
Known risks: direct navigation after creation depends on the application
router completing the destination load; existing error handling remains
unchanged if the creation use case fails.
Next phase: 12 — Refine shared guest UX.

Phase: 12 — Refine shared guest UX
Status: complete
Commit: — (working tree)
Implemented scope: independent shared-access context bars with Aquarium name
and Solo lectura wording, Spanish labels for granted categories, measurements
history navigation only when measurements are granted, and clearer revocation
or pending-invitation feedback. The owner shell, bottom navigation and write
affordances remain outside shared routes.
Files: shared Aquarium and measurement-history UI, styles, shared-access E2E
expectations, and this execution record.
Automated validation: 75 unit-test files and 311 tests passed; architecture,
lint, format check, diff check, production build and 11 security-pagination E2E
tests passed.
Manual validation: the real invitation, scoped-read and revocation journey was
executed through Playwright.
Deferred items: full viewport, keyboard, screen-reader and zoom acceptance is
deferred to Phase 13.
Known risks: the measurement history page performs a separate shared-context
read to show the Aquarium name; revocation remains authoritative through the
existing access service and error state.
Next phase: 13 — Accessibility and responsive acceptance pass.

Phase: 13 — Accessibility and responsive acceptance pass
Status: complete
Commit: — (working tree)
Implemented scope: responsive wrapping for narrow equipment actions; explicit
main landmarks and independent read-only context bars on shared routes;
Spanish labels for shared permission categories; clearer revoked or pending
access feedback; long Aquarium names constrained without horizontal overflow;
and E2E expectations for guest context, accessible landmarks and absence of
owner write affordances.
Files: equipment list styles; shared Aquarium and measurement-history pages,
styles and context loading; security-pagination and maintenance Playwright
journeys.
Automated validation: 75 unit-test files and 311 tests passed; architecture,
lint, format check, diff check, production build and the complete atomized E2E
target passed: equipment 1, keeper journey 3, livestock 1, maintenance 1 and
security-pagination 11 tests.
Manual validation: focused review of landmarks, headings, accessible names,
status/error roles, focus-preserving record entry, compact navigation and
narrow action wrapping in templates and CSS; the live Playwright journeys
covered scoped access, revocation, deep navigation and the responsive owner
recording entry flow.
Deferred items: physical-device and assistive-technology review, including a
dedicated 200% zoom capture at every required viewport, remains for the next
visual consolidation pass if it requires interactive design review.
Known risks: the shared measurement-history header performs a separate access
read to obtain the Aquarium name; the history reader remains authoritative
when access is revoked. Material controls retain their framework-provided
focus and touch behavior.
Next phase: 14 — Visual consolidation.

Phase: 14 — Visual consolidation
Status: complete
Commit: — (working tree)
Implemented scope: consolidated demonstrably shared presentation values into
Material-compatible CSS custom properties for form, readable-list and wide
content widths, plus section and heading spacing. Existing feature-specific
styles, semantic colors, responsive breakpoints and light-only behavior remain
local and unchanged.
Files: `apps/tankos/src/styles.css` and the affected shell, Aquarium, care,
equipment, livestock, maintenance, measurements, observations, timeline,
species and shared-access page styles.
Automated validation: 75 unit-test files and 311 tests passed; architecture,
lint, format check, diff check, production build and the complete atomized E2E
target passed: equipment 1, keeper journey 3, livestock 1, maintenance 1 and
security-pagination 11 tests.
Manual validation: cross-page CSS comparison confirmed the same content-width
and spacing hierarchy across top-level destinations, forms, lists, history
surfaces and feedback containers; Material theme tokens remain the source for
color, typography, shape and elevation.
Deferred items: no dark mode or visual-regression infrastructure was added;
interactive device and assistive-technology review remains governed by the
acceptance record in Phase 13.
Known risks: CSS custom properties are intentionally presentation-only and
must not become a feature utility layer; feature-specific exceptions still
need local review when a page has different reading density or composition.
Next phase: — UX implementation path complete.

Validation addendum (2026-08-20): the automated acceptance suite now includes
`apps/tankos/e2e/accessibility-responsive.spec.ts`, with Axe checks at 320, 390,
768 and 1280 px, landmark and heading assertions, keyboard focus, reduced
motion, horizontal-overflow and 44 px interactive-target checks. The private
shell now exposes its title as the page heading and its application bar as a
header landmark. The atomized E2E target includes this suite: 6 suites and 19
tests passed. Physical-device, screen-reader and 200% zoom review remain
manual acceptance items.

Do not rewrite earlier entries to make later results look cleaner. Corrections
must remain traceable.

## 9. Global definition of success

The UX migration is complete when:

- a returning keeper reaches the active Aquarium's `Hoy` without passing
  through a capability menu;
- the active Aquarium is clear on every scoped page;
- `Hoy`, `Agenda`, `Historial` and `Acuario` are stable primary destinations;
- frequent recording starts from one predictable `Registrar` action;
- successful flows return to a useful context;
- mobile navigation and content work at 320px and 200% zoom;
- desktop uses the same information architecture adaptively;
- all user-facing terminology is Spanish and domain-consistent;
- guest access is clearly read-only and permission-scoped;
- no domain, authorization, history or persistence rule was weakened for
  presentation convenience;
- focused and complete validation passes, with any unrelated baseline failure
  explicitly recorded rather than concealed.
