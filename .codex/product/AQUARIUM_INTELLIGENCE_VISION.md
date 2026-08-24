# Aquarium Intelligence Strategic Vision

**Status:** candidate strategic horizon; this document does not authorize
domain, persistence, AI, automation, device-control or health-advice behavior.

**Decision authority:** the user/product owner. All proposals remain pending
until an explicit decision is recorded in
[`PRODUCT_IDEA_REGISTER.md`](PRODUCT_IDEA_REGISTER.md).

**Input:** two external ideation proposals reviewed on 2026-08-20 after the
Coral Mastery audit.

This document preserves the complete ambition of an Aquarium digital model,
evidence relationships, computer vision, quantitative analysis and integrated
assistance. It records technical, evidential and safety consequences without
accepting or rejecting the proposals. It is written as a staged research and
product path so that a limited-context agent can investigate one bounded
outcome after the user selects it.

Normative-looking constraints in this document describe the current accepted
Veril baseline or a risk-control option. They do not decide the final product
scope. If the user chooses a conflicting proposal, stop and document which
existing Vision, domain rule or specification must be reconsidered rather than
silently discarding the user's choice.

It complements:

- [`../VISION.md`](../VISION.md);
- [`MENTAL_MODEL.md`](MENTAL_MODEL.md);
- [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md);
- [`UX_PHILOSOPHY.md`](UX_PHILOSOPHY.md);
- [`CORAL_MASTERY_IMPROVEMENT_PLAN.md`](CORAL_MASTERY_IMPROVEMENT_PLAN.md);
- [`../DOMAIN_RULES.md`](../DOMAIN_RULES.md);
- [`../DEFINITION_OF_READY.md`](../DEFINITION_OF_READY.md).

## 1. Product thesis

Veril can differentiate itself by helping a keeper build an explainable digital
model of one Aquarium—freshwater, saltwater, brackish, planted, reef, shrimp,
snail or mixed—and relate trustworthy evidence to its structure,
Livestock, Equipment and Care.

One agent-proposed long-term direction is:

```text
Aquarium structure and configuration
  + independently owned source Facts
  + attributable Knowledge
  + explicit relationships
  -> explainable read models
  -> bounded hypotheses and scenarios
  -> keeper-confirmed decisions
```

The agent previously proposed avoiding this direction:

```text
incomplete logs
  -> opaque score
  -> confident diagnosis
  -> automatic treatment or dosing
```

The associated agent proposal was that structured data remain source truth and
that an LLM, statistical model or simulator explain or evaluate selected inputs
without becoming the owner of Aquarium truth. This is a candidate product and
architecture constraint, not a user decision.

## 2. System coverage

The AquariumSystem model supports freshwater, saltwater, brackish, planted,
reef, shrimp, snail and mixed systems. Classification dimensions and
specialized calculations may be introduced incrementally, but the root model
must not assume a marine-only Aquarium.

## 3. Terminology alternatives for user decision

The agent previously replaced several external terms. Both the original and the
alternative are preserved here so the user can choose the product language and
required fidelity:

| External term       | Veril term                             | Reason                                                                                  |
| ------------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| Digital Twin        | Aquarium Digital Model                 | `Digital Twin` overstates fidelity until sensor-backed calibration and validation exist |
| Causal graph        | Evidence Relationship Graph            | Relationships and temporal order do not prove causality                                 |
| Causal Timeline     | Contextual Timeline                    | Source events may be overlaid without causal claims                                     |
| Simulator           | Scenario Analysis                      | Outputs depend on explicit assumptions and uncertainty                                  |
| Predictive alert    | Forecast or deviation candidate        | Prediction quality and delivery are separate concerns                                   |
| Automatic diagnosis | Guided evidence review                 | Animal-health claims require strong evaluation and cautious output                      |
| Smart dosing        | Keeper-confirmed dosing calculation    | Veril must not silently prescribe or actuate dosing                                     |
| Aquarium health     | Multidimensional evidence summary      | Avoid opaque combined scores                                                            |
| AI recommendation   | Attributable hypothesis or explanation | Source, uncertainty and user purpose must remain visible                                |

Selecting an alternative term does not by itself decide the underlying
behavior, validation or safety contract.

## 4. Evaluation of the proposals

### 4.1 Ideas the agent previously favoured

The following ideas were previously assessed by the agent as strong fits. That
assessment is recorded for context and is not prioritization or acceptance:

- an Aquarium structural model with real volume, compartments and associated
  Equipment;
- explicit relationships among source records and Aquarium entities;
- a Contextual Timeline that overlays Measurements and accepted events;
- rates of change with visible samples and periods;
- Aquarium-specific deviations instead of universal thresholds;
- photography as attributable evidence;
- Equipment service history and condition evidence;
- inventory, lots, expiry and estimated remaining consumables;
- operating-cost review independent of commerce;
- a Knowledge library that separates source classes;
- a calm daily briefing that may conclude that no action is justified.

### 4.2 Ideas the agent previously reframed

| Proposal                     | Safe candidate                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Nitrogen or ionic simulation | Research model with declared inputs, calibration set, error bounds and no treatment claim                    |
| Fish/coral biometry          | Identification and size hypothesis requiring human confirmation and a scale reference                        |
| Disease detection            | Visual triage research that may abstain and never prescribes treatment automatically                         |
| Dynamic dosing               | Transparent calculator based on verified product concentration, measured consumption and keeper confirmation |
| Growth projection            | Photo comparison and observed change before any forward forecast                                             |
| Flow simulation              | User-entered or measured flow layer before any approximate physical model                                    |
| Compatibility prediction     | Contextual evidence checklist with uncertainty, not a binary compatibility oracle                            |
| Maintenance prediction       | Condition-based suggestion only when a measurable condition and enough service history exist                 |
| Aquarium Intelligence        | Explainable operational briefing over accepted reads, not a general chatbot                                  |
| Community recipes            | Versioned Aquarium blueprints or protocols with provenance; no generic social network                        |

### 4.3 Ideas previously rejected or deferred by the agent

The items below are restored as `pending-user-decision`. The list records the
agent's earlier risk concerns, not a product decision:

- exact chemical predictions derived only from biomass, food and nominal
  filtration;
- automatic dosing adjustment based on photographs;
- treatment recommendations generated directly from disease classification;
- cross-Parameter pattern rules presented as diagnoses;
- autonomous Equipment control before command authority, fail-safe state,
  audit, recovery and physical safety are accepted;
- a 3D/CFD-looking flow result that has not been validated against the actual
  Aquarium;
- plant/CO2 planning inside the marine MVP;
- recommendations biased toward products, affiliates or loyalty mechanics;
- a generic community feed or social network;
- combined health scores, even when renamed as intelligence.

## 5. Conceptual model

This is a discovery map, not an accepted aggregate or persistence design:

```text
Aquarium
  |
  +-- structural context
  |     AquariumSystem and component hypotheses
  |     display, sump, refugium and auxiliary-component hypotheses
  |     nominal and measured volumes
  |     spatial zones
  |
  +-- associated entities
  |     Equipment
  |     Livestock
  |     consumable candidates
  |
  +-- source evidence
  |     Measurements
  |     Observations
  |     Care Work
  |     Water Changes
  |     photos
  |     telemetry candidates
  |
  +-- configuration
  |     Parameter profile
  |     keeper targets
  |     recurring Care
  |     protocols
  |
  +-- read models
        Contextual Timeline
        Evidence Relationship Graph
        rates and deviations
        spatial overlays
        operational briefing
```

Aquarium components, spatial zones, consumables and telemetry remain hypotheses
until accepted use cases establish their identity, lifecycle and ownership.

## 6. Evidence Relationship Graph

The proposed graph is a read model over accepted sources, not a graph database
requirement and not a new source of truth.

Every relationship must be classified:

| Relationship class | Example                                          | Authority                 |
| ------------------ | ------------------------------------------------ | ------------------------- |
| Structural         | Equipment is associated with Aquarium            | Accepted source entity    |
| Spatial            | Coral is placed in declared zone                 | Keeper configuration      |
| Historical         | Care Work was performed on Equipment             | Durable source Fact       |
| Documentary        | Species Profile cites a source                   | Attributable Knowledge    |
| Temporal           | Measurement occurred three days after Care       | Derived from timestamps   |
| Statistical        | Two series changed together in selected period   | Derived read with method  |
| Hypothetical       | Increased feeding may contribute to nitrate rise | Attributed interpretation |

Do not store `causes`, `improves`, `harms` or equivalent edges as facts without
an accepted evidence policy. A hypothesis must include author/model,
calculation or source, input records, time, uncertainty and lifecycle.

## 7. Contextual Timeline and quantitative analysis

The first useful analytical progression is:

```text
bounded source history
  -> event overlays
  -> rate of change
  -> Aquarium-specific baseline
  -> deviation candidate
  -> hypothesis
  -> scenario analysis
```

Do not skip directly from a chart to recommendation.

### 7.1 Event overlays

Overlay only accepted records such as Livestock association, Care Work, Water
Change, Equipment lifecycle or keeper-declared configuration changes. The UI
may say that one record occurred before or after another. It must not imply that
the first caused the second.

### 7.2 Rates of change

Every displayed rate must expose:

- Parameter and canonical Unit;
- start/end records and correction state;
- selected period;
- number and spacing of samples;
- calculation method;
- missing or excluded data;
- uncertainty or inability to calculate.

Two-point slopes may be displayed only as two-point change, not established
consumption. Calcium, alkalinity, magnesium, nitrate, phosphate, evaporation,
ATO and consumable forecasts each require their own accepted semantics.

### 7.3 Aquarium-specific deviations

A deviation model requires minimum sample count, baseline window, sampling
regularity, method/provenance handling, corrected records and an evaluation set.
Its output describes departure from recorded behavior, not health or safety.

Example:

> This alkalinity value differs from the recent recorded pattern. It may still
> be acceptable for some Aquariums. Confirm the test method or record another
> sample before interpreting the change.

### 7.4 Cross-Parameter patterns

Cross-series analysis may rank temporal/statistical associations. It must not
encode unsupported rules such as “alkalinity falling plus nitrate rising means
coral overpopulation or skimmer failure”. Any hypothesis must show alternative
explanations and the evidence needed to distinguish them.

## 8. Computer vision strategy

Computer vision must be split into independent evaluated use cases.

### 8.1 Photo-assisted test reading

**Candidate outcome:** propose a test result for keeper confirmation.

**Required inputs:** exact manufacturer/test definition, color chart version,
test procedure step, image, device metadata allowed by privacy policy and a
capture reference or calibration method.

**Required behavior:**

- guide framing, focus, exposure and neutral reference capture;
- reject unsuitable images rather than forcing a value;
- return proposed value/range, confidence and failure reason;
- require keeper confirmation before creating a Measurement;
- persist provenance `photo-assisted` only after it is accepted;
- retain or delete the source image according to explicit policy;
- evaluate separately by test, chart version, device and lighting condition.

White-balance correction cannot guarantee accuracy by itself. Do not claim that
the camera eliminates visual or reagent uncertainty.

### 8.2 Species identification

**Candidate outcome:** offer ranked Species Profile candidates for keeper
selection.

The result must support `unknown`, show distinguishing evidence and never create
Livestock automatically. Count and size estimation are separate use cases.
Size requires a scale reference or calibrated geometry; perspective-only size
must be labelled approximate.

### 8.3 Growth and appearance comparison

Start with aligned chronological photos and keeper-selected points of interest.
Do not infer biological growth when framing, zoom, lighting or orientation
changed. Automatic segmentation and area estimates require repeatable capture
and evaluation against manually annotated examples.

### 8.4 Visual health triage

This is high-risk future research. The system must distinguish visual feature,
possible category, missing evidence and unsupported diagnosis. It must abstain
when confidence is insufficient and must not produce medication, isolation or
treatment instructions solely from model output.

## 9. Quantitative calculators and scenarios

### 9.1 Keeper-confirmed dosing calculator

The first safe calculator uses explicit:

- measured current value;
- keeper target;
- accepted water volume;
- verified product concentration/instructions;
- maximum adjustment policy if accepted;
- calculation formula and rounding;
- explicit keeper confirmation.

It calculates a proposal. It does not infer local source-water chemistry,
choose a target, write a Measurement or command a doser.

### 9.2 Scenario Analysis

A scenario is non-operative and records:

- proposed change;
- selected Aquarium snapshot;
- assumptions;
- known and missing inputs;
- rules or models used;
- possible effects and confidence;
- checks required before deciding;
- creation/expiry time.

Candidate scenarios include adding Livestock, replacing Equipment, changing
light schedule or estimating operating cost. Chemical, growth, aggression and
flow forecasts remain separate models with separate evaluation.

### 9.3 Biogeochemical research models

No nitrogen, ionic, trace or biomass model is ready merely because the data
fields exist. A model requires a defined question, measurable output, training
or calibration evidence, benchmark, error metric, applicability limits and
safe failure. Nominal skimmer or biological-media specifications are not proof
of actual export capacity.

## 10. IoT and hardware integration strategy

The safe progression is:

```text
device inventory
  -> read-only observation
  -> calibrated telemetry
  -> stale/offline presentation
  -> evaluated alerts
  -> keeper-confirmed command
  -> tightly bounded automation, if ever accepted
```

### 10.1 Aggregator first

Prefer one integration boundary such as Home Assistant when it can expose
multiple devices locally. Do not add Sonoff, Inkbird, Chihiros, Neptune, GHL,
Kamoer or another vendor SDK independently without a concrete unsupported use
case.

### 10.2 Telemetry contract

Every sample needs stable device/sensor identity, Parameter definition,
canonical Unit mapping, sampled and received times, calibration/provenance,
quality or availability state and Aquarium authorization.

MQTT or an API is transport, not trusted domain meaning. Validate external
payloads with Zod and map them through a provider adapter.

### 10.3 Commands and automation

Read access does not grant command authority. Commands require explicit device
capability, actor authorization, idempotency, timeout, observed acknowledgement,
safe state, audit and recovery. Automatic dosing, heating, flow or lighting is
outside this vision until each physical safety model is accepted.

## 11. Spatial and Aquascape planning

Start with a 2D marine layout:

- Aquarium dimensions and declared zones;
- approximate rock footprint;
- Equipment placement;
- Livestock placement;
- keeper-entered PAR or flow observations;
- maintenance-access notes;
- approximate distances.

Later layers may show measured PAR points, declared flow direction, coral
spacing guidance and territory notes with evidence. A 3D editor is justified
only after 2D placement proves useful. A rendered flow field must not resemble
validated CFD unless actual model validation supports it.

## 12. Guided maturation and introductions

A guided cycling/maturation capability should be protocol-aware rather than a
universal phase detector.

The keeper selects or authors a protocol with attributable Knowledge, records
what was actually added/measured and sees expected checkpoints separately from
evidence. Veril may say that a checkpoint is unconfirmed. It must not declare a
cycle complete or pause Livestock introduction solely from one hidden formula.

An introduction plan may combine accepted Species Profile Knowledge,
Aquarium dimensions, current Livestock, declared territory and keeper plans.
Compatibility remains contextual and uncertain; it is not a binary species
matrix.

## 13. Inventory, consumables and cost

### 13.1 Consumable inventory

Candidate data includes product identity, lot, expiry, initial amount, Unit,
opened time, explicit usage and estimated remainder. A forecast must distinguish
measured stock from calculated stock and expose usage records and method.

Scanning a label may prefill a candidate product, but the keeper confirms it.
Do not couple inventory to one store or use it to insert product suggestions.

### 13.2 Cost review

Separate capital purchase, recurring expense, measured energy and estimated
energy. Every estimate states currency, tariff period, tax assumptions, power,
duration and source. Scenario cost comparison must not claim savings from
nominal wattage alone when real duty cycle is unknown.

## 14. Evidence-based Knowledge and blueprints

Knowledge claims should distinguish:

- manufacturer statement;
- official manual or technical document;
- scientific literature;
- professional source;
- community report;
- observed Aquarium evidence;
- deterministic Veril derivation;
- statistical/model inference;
- AI-generated hypothesis.

Confidence cannot be assigned only from source-class labels. It must follow an
accepted evidence policy.

Versioned Aquarium blueprints may eventually share structure, Equipment,
targets and protocols as portable templates. Applying a blueprint creates
reviewable proposed configuration; it does not copy another Aquarium's Facts,
ownership, Livestock occurrences or private history. Forks and variants are
version relationships, not a reason to build a social feed.

## 15. Aquarium Intelligence briefing

The long-term daily briefing composes accepted read models and answers:

- what changed since the last review;
- what remained materially unchanged;
- which evidence is missing or contradictory;
- what Care is due or upcoming;
- which Incidents are open;
- whether any deviation candidate merits confirmation;
- why no action may be the safest current conclusion.

Each sentence links to source evidence or an explicit calculation. The briefing
must support an entirely deterministic first version. AI is optional wording or
hypothesis assistance after Phase 10 of the improvement plan; quota, provider
failure or disabled consent must not remove the ordinary briefing.

## 16. Staged delivery path

An agent must execute one phase or named subphase per task.

### Horizon A0 — Accept the structural question

**Status:** discovery.

Decide the first user question that requires Aquarium structure beyond current
name, location, timezone and targets. Validate which Aquarium component, zone
or measured volume needs identity.

**Deliverable:** one accepted specification, updated glossary/domain rules only
when durable language is established, and no speculative persistence.

**Stop if:** the proposed model attempts to represent every possible Aquarium
before one use case consumes it.

### Horizon A1 — Add the minimum Aquarium structural model

**Status:** candidate; depends on A0.

Implement only the accepted structure, its owner-scoped configuration and one
consumer. Likely starting areas are Aquarium Management domain/application,
the `Acuario` composition page, Firestore validation/Rules and deterministic
reconstruction tests.

**Acceptance:** current Aquariums remain readable and the new structure answers
the accepted question without becoming a generic JSON model.

### Horizon B1 — Contextual Timeline overlays

**Status:** candidate; depends on accepted source events.

Add one overlay type to one Parameter history. Preserve source links,
timestamps, bounded reads and non-causal wording.

**Acceptance:** a keeper can see temporal context and distinguish Measurement,
event and interpretation.

### Horizon B2 — Rates and Aquarium-specific deviations

**Status:** candidate; rates before deviations.

Implement one rate with explicit samples/method, then define an offline
evaluation corpus before adding one deviation detector.

**Acceptance:** sparse, irregular, corrected and method-changed data cause
abstention or explicit limitations rather than confident output.

### Horizon C1 — Photo-assisted test reading

**Status:** research candidate; depends on photo evidence infrastructure.

Select one exact commercially available test/version, build a labelled
evaluation set across supported capture conditions and measure value/range
error plus abstention. Human confirmation is mandatory.

**Starting areas:** photo-evidence boundary, a separate vision provider port,
test-definition Knowledge and Measurement draft UI. Do not place model output
inside the Measurement domain constructor.

### Horizon C2 — Identification and visual tracking

**Status:** research candidate; independent subphases.

Start with ranked species candidates, then repeatable photo comparison. Size,
count, disease and treatment are not bundled into identification.

### Horizon D1 — Read-only Home Assistant telemetry

**Status:** candidate after a concrete device question.

Read one sensor through a local/provider adapter, validate and map its Parameter
and Unit, expose sampled/received/calibration state and prove stale/offline and
cross-Aquarium behavior. Do not issue commands.

### Horizon D2 — Condition-aware Equipment maintenance

**Status:** candidate after Equipment-linked Care and reliable condition input.

Use one objective condition such as measured flow or recorded calibration drift
and enough service history. Compare the suggestion with the existing fixed
schedule before replacing it.

### Horizon E1 — Keeper-confirmed calculator

**Status:** candidate.

Implement one transparent calculator with verified formula, bounded inputs,
unit tests and no persistence side effect. Dosing is never the first calculator
unless concentration, volume, target and safety policy are accepted.

### Horizon E2 — Scenario Analysis

**Status:** research candidate.

Implement one non-chemical scenario first, such as cost or Equipment
replacement. Show assumptions and alternatives. Add Livestock, chemistry,
growth or flow models only through separate evaluation gates.

### Horizon F1 — Marine 2D placement map

**Status:** candidate after structural identity exists.

Add one accessible 2D placement surface and textual equivalent. Store declared
positions, not inferred physical precision. Prove mobile editing and avoid a 3D
dependency.

### Horizon G1 — Guided maturation protocol

**Status:** candidate.

Select one attributable marine maturation protocol and keep expected
checkpoints separate from recorded Facts. The keeper confirms progress and
Livestock decisions.

### Horizon H1 — Consumables and cost

**Status:** candidate in independent subphases.

Add one consumable with explicit usage before forecasting remainder. Add one
measured or declared cost category before a total-cost dashboard.

### Horizon I1 — Evidence-aware operational briefing

**Status:** future composition phase.

Compose deterministic changes, upcoming Care, contradictions and data gaps.
Add model-generated hypotheses only after their individual capabilities pass
evaluation.

## 17. Dependency map

```text
Improvement plan foundations
  Parameter profile, provenance, relationships, photos, export, explainability
       |
       +--> A0/A1 structural model
       |      +--> F1 spatial 2D map
       |      +--> E2 scenario analysis
       |
       +--> B1 contextual Timeline
       |      +--> B2 rates and deviations
       |             +--> I1 operational briefing
       |
       +--> C1 photo-assisted test reading
       |      +--> C2 identification and visual tracking
       |
       +--> D1 read-only telemetry
       |      +--> D2 condition-aware maintenance
       |
       +--> E1 keeper-confirmed calculator
       |
       +--> G1 guided maturation
       |
       +--> H1 consumables and cost
```

No horizon depends on AI as a prerequisite. Device commands, automatic dosing,
health diagnosis and high-confidence biogeochemical prediction are outside this
dependency map.

## 18. Research and acceptance contract

Every model-backed capability must document:

```text
User question:
Decision affected:
Source inputs:
Ground truth or reference:
Evaluation dataset:
Train/test separation when applicable:
Metrics:
Minimum acceptable performance:
Abstention behavior:
Known applicability limits:
Privacy and retention:
Cost and latency budget:
Human confirmation:
Failure and provider-outage UX:
```

Minimum relevant tests include:

- deterministic domain/application examples;
- malformed and unauthorized external input;
- sparse, stale, contradictory and corrected evidence;
- cross-Aquarium isolation;
- model abstention and provider failure;
- accessible non-visual alternative for charts/maps/images;
- reproducible evaluation results outside production;
- no automatic domain write from a model response.

## 19. Agent-drafted strategic order pending user decision

1. Complete the immediate evidence/configuration phases in the improvement
   plan.
2. Accept the minimum Aquarium structural question.
3. Add Contextual Timeline overlays and one transparent rate.
4. Build the deterministic operational briefing.
5. Add read-only telemetry only for a real installed sensor.
6. Evaluate one exact photo-assisted test reader.
7. Add a marine 2D placement map if structure/placement proves valuable.
8. Add one transparent calculator and one low-risk scenario.
9. Add guided maturation, consumables and cost independently.
10. Consider statistical deviations, visual identification and
    condition-aware maintenance after evaluation data exists.
11. Keep treatment, automatic dosing, command/control and biogeochemical
    prediction outside implementation until their safety and validation burden
    is explicitly accepted.

## 20. Candidate definition of strategic success

This vision succeeds when Veril can answer a keeper's question with structured,
traceable Aquarium context while clearly distinguishing:

- source evidence;
- keeper configuration;
- attributable Knowledge;
- deterministic derivation;
- statistical association;
- model hypothesis;
- missing information;
- uncertainty and abstention.

It fails if a visually impressive graph, 3D model, assistant or prediction
makes unsupported certainty harder for the keeper to detect.
