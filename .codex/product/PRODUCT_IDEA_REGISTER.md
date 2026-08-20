# Product Idea Register

**Decision authority:** the user/product owner.

**Recorded technical precedence:** when a recorded product decision conflicts
with a technically required practice for Firebase/Firestore security,
consistency, limits, reliability or data integrity, the technically correct
solution prevails. The deviation and its resulting behavior must be documented.

**Recorded BatchOperations architecture:** batch management is a domain of its
own, not a generic helper inside `shared`. It uses a reusable execution engine
through ports/adapters. The domain owns lifecycle, confirmation, frozen scope,
authorization policy, resumability, warnings, concurrency semantics and
terminal cleanup. The reusable engine owns chunking, progress, idempotency,
retries and partial execution. Firebase/Firestore is the initial execution
adapter.

**Status:** exhaustive proposal register. Items are `pending-user-decision`
unless a later entry records an explicit user decision and links its accepted
specification or rejection rationale.

This register preserves ideas gathered from the Coral Mastery audit, assistant
analysis and two external ideation responses. Inclusion is not endorsement;
risk notes are not rejection. No agent may silently omit, reject, defer,
prioritize or redefine an item in this file.

Source groups retained by this register:

1. the live Coral Mastery functional and Premium audit;
2. improvements proposed by the agent during that audit;
3. the external Digital Twin, evidence graph, causal Timeline, vision,
   simulation, operating-cost and integrated-assistant proposal;
4. the external computer-vision, biogeochemical modelling, IoT, aquascape,
   predictive-log, hardware-hub, cycling, community-recipe and absence-mode
   proposal;
5. the user's requirement that measurable Parameters be configurable.

When the user decides an item, append rather than erase:

```text
Decision:
Date:
Scope selected:
Rationale supplied by user:
Specification or decision record:
Supersedes:
```

## 1. Aquarium and system modelling

| ID      | Proposal                              | Preserved scope                                                                                                                                                                                    | Questions for user decision                                                                             | Status                |
| ------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------- |
| SYS-001 | Aquarium Digital Model / Digital Twin | Model vessel, real/nominal volume, sump or AIO, chambers, pumps, lighting, skimmer, reactors, refugium, ATO, rock, sand, biological media, Livestock, consumables, positions, targets and routines | Required fidelity; first consumer; sensor/calibration requirements                                      | accepted-direction    |
| SYS-002 | Aquarium component identity           | Represent observable water, life, technical or auxiliary areas inside an AquariumSystem                                                                                                            | Component identity, lifecycle, cardinality and ownership; display, sump, chamber and breeding-box roles | accepted-direction    |
| SYS-003 | Component and zone identity           | Represent sump, AIO chambers, hydraulic/biological/technical components and zones                                                                                                                  | Detailed lifecycle, topology and relationships remain future slices                                     | accepted-direction    |
| SYS-004 | Hydraulic topology                    | Connect pumps, returns, overflows, chambers, filters and declared/measured flows                                                                                                                   | Precision, units, validation and whether simulation consumes it                                         | pending-user-decision |
| SYS-005 | Substrate and biological-media model  | Record rock, sand and biological media type, amount and placement                                                                                                                                  | Inventory versus Aquarium structure; historical changes                                                 | pending-user-decision |
| SYS-006 | Spatial zones                         | Name and locate zones for light, flow, territory and maintenance access                                                                                                                            | 2D/3D coordinates, precision and lifecycle                                                              | pending-user-decision |
| SYS-007 | Aquarium classification expansion     | Reef marine, other marine, freshwater, brackish, planted, biotope and mixed variants                                                                                                               | Exact controlled labels and first-slice catalogue coverage                                              | accepted-direction    |
| SYS-008 | Biological component model            | Represent bacteria or microbial populations, plants, macroalgae, refugium biomass and other non-Livestock biological components                                                                    | Which components have identity; directly observed versus estimated state; lifecycle and history         | pending-user-decision |

## 2. Parameters, Measurements and chemistry

| ID      | Proposal                               | Preserved scope                                                                                                                                                                                                                                                       | Questions for user decision                                                                                                | Status                |
| ------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| PAR-001 | Central Parameter definition catalogue | One authoritative definition for ID, quantity, canonical/accepted Units, precision and target eligibility                                                                                                                                                             | Code-owned versus persisted catalogue; versioning                                                                          | pending-user-decision |
| PAR-002 | Aquarium-specific Parameter profile    | Enable, disable and order Parameters independently per Aquarium                                                                                                                                                                                                       | Legacy default, empty profile, disabled targets/history                                                                    | accepted-direction    |
| PAR-003 | Custom Parameters                      | Keeper-defined Parameter identity, quantity, Units, precision and lifecycle                                                                                                                                                                                           | Owner/Aquarium scope, archive/delete, sharing, conflicts with future system Parameters                                     | accepted-direction    |
| PAR-004 | Wider built-in catalogue               | Calcium, magnesium, pH, potassium, strontium, boron, bromine, sulphur, iodine, iron, zinc, manganese, vanadium, fluorine, molybdenum, nickel, chromium, cobalt, aluminium, silicon, copper, tin, lead, ammonia, nitrite, organic phosphate, conductivity, TDS and ORP | Which Parameters and order; canonical Units; target eligibility                                                            | pending-user-decision |
| PAR-005 | Measurement Session                    | Record several Measurements with shared sample/time/method context                                                                                                                                                                                                    | Durable session identity, atomicity, correction representation                                                             | pending-user-decision |
| PAR-006 | Measurement provenance                 | Manual, kit, photo-assisted, ICP, imported, sensor or other source                                                                                                                                                                                                    | Accepted source classes and required metadata                                                                              | pending-user-decision |
| PAR-007 | Test kit and reagent metadata          | Manufacturer, test version, method, lot, opened/expiry dates                                                                                                                                                                                                          | Separate inventory relation or Measurement snapshot                                                                        | pending-user-decision |
| PAR-008 | Plausibility and duplicate feedback    | Warn or block impossible, improbable or duplicate entries                                                                                                                                                                                                             | Threshold ownership; warning versus validation; override behavior                                                          | pending-user-decision |
| PAR-009 | Calculators and timers                 | Brand-specific test calculators, reagent conversions and test timers                                                                                                                                                                                                  | Supported manufacturers; liability; offline behavior                                                                       | pending-user-decision |
| PAR-010 | SG/PPT and Unit conversion             | Allow compatible entered Units while retaining a canonical Unit                                                                                                                                                                                                       | Conversion policy, temperature compensation and precision                                                                  | accepted-direction    |
| PAR-011 | Parameter targets                      | Keeper-owned, product-defined, species-derived or model-suggested ranges                                                                                                                                                                                              | Which target sources are allowed and how authority is shown                                                                | pending-user-decision |
| PAR-012 | Universal biological ranges            | Ship product ranges for status or guidance                                                                                                                                                                                                                            | Source, applicability, override and liability                                                                              | pending-user-decision |
| PAR-013 | Historical editing/deletion            | Replace, delete, correct or retain source Measurements                                                                                                                                                                                                                | Whether current append-only policy remains; retention and recovery                                                         | pending-user-decision |
| PAR-014 | Rates of change                        | KH/Ca/Mg consumption, NO3/PO4 increase and other per-time rates                                                                                                                                                                                                       | Minimum samples, method, confidence and display                                                                            | pending-user-decision |
| PAR-015 | Aquarium-specific baseline             | Learn typical behavior for one Aquarium                                                                                                                                                                                                                               | Window, sample quality, method changes and reset                                                                           | pending-user-decision |
| PAR-016 | Anomaly detection                      | Identify deviations from ranges, personal baseline or multivariate pattern                                                                                                                                                                                            | Thresholds, model, confidence, acknowledgement and action                                                                  | pending-user-decision |
| PAR-017 | Cross-Parameter patterns               | Detect simultaneous or lagged changes across Parameters                                                                                                                                                                                                               | Correlation/causation language, evaluation set and hypotheses                                                              | pending-user-decision |
| PAR-018 | Nitrogen-cycle model                   | Predict ammonia/nitrite/nitrate behavior from biomass, food and filtration                                                                                                                                                                                            | Model validity, calibration, uncertainty and intended decisions                                                            | pending-user-decision |
| PAR-019 | Ionic/trace model                      | Predict KH, Ca, Mg and trace consumption                                                                                                                                                                                                                              | Required inputs, calibration and accepted error                                                                            | pending-user-decision |
| PAR-020 | Dynamic dosing calculator              | Calculate additives or Water Changes from volume, target, consumption and product concentration                                                                                                                                                                       | Exact formula, source water, safety limits, confirmation and automation                                                    | pending-user-decision |
| PAR-021 | Automatic dosing adjustment            | Change doser settings from Measurements, photos or predictions                                                                                                                                                                                                        | Authority, physical safety, rollback, audit and supported hardware                                                         | pending-user-decision |
| PAR-022 | Chemistry forecast                     | Predict when a Parameter will cross a target                                                                                                                                                                                                                          | Confidence, minimum evidence, target source and notification                                                               | pending-user-decision |
| PAR-023 | ICP import/extraction                  | Extract laboratory results and map them to Parameters                                                                                                                                                                                                                 | Supported laboratories/formats, validation and provenance                                                                  | pending-user-decision |
| PAR-024 | Evaporation and ATO forecasting        | Calculate evaporation rate, ATO consumption and estimated reservoir duration                                                                                                                                                                                          | Measurement source, refill events, seasonality, confidence and notification                                                | pending-user-decision |
| PAR-025 | FIWARE/NGSI measurement model          | Model measurement properties and observations around FIWARE Smart Data Models and expose Units through UN/CEFACT Common Codes (`unitCode`)                                                                                                                            | Internal domain contract versus interoperability adapter; selected FIWARE entity/model; NGSI-LD representation and context | accepted-direction    |

## 3. Analytics, Timeline and state

| ID      | Proposal                             | Preserved scope                                                                                                       | Questions for user decision                                  | Status                |
| ------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------- |
| ANA-001 | Parameter charts                     | Single-series history with selectable time windows                                                                    | Library, bounded reads, corrections and target overlays      | pending-user-decision |
| ANA-002 | Multi-Parameter comparison           | Compare two or more series                                                                                            | Normalization, Units, scaling and interpretation language    | pending-user-decision |
| ANA-003 | Contextual/Causal Timeline           | Overlay Measurements with Livestock, Equipment, feeding, Care and Water Changes                                       | Whether causal claims are allowed; source events and filters | pending-user-decision |
| ANA-004 | Evidence Relationship/Causal Graph   | Relate biology, physics, chemistry, Equipment, Livestock and events                                                   | Graph technology, relation classes and causal authority      | pending-user-decision |
| ANA-005 | Aquarium health score                | One combined numeric score                                                                                            | Formula, dimensions, uncertainty and explainability          | pending-user-decision |
| ANA-006 | Multidimensional ecosystem state     | Chemical stability, nutrients, maturity, oxygenation, compatibility, biological capacity, light, flow and maintenance | Dimensions, policies, evidence and labels                    | pending-user-decision |
| ANA-007 | Data consistency review              | Surface contradictions, missing metadata and broken references                                                        | Checks, severity, persistence and correction links           | pending-user-decision |
| ANA-008 | Explainability panel                 | Show sources, dates, samples, targets, correction state and missing inputs                                            | Required explanation contract per consumer                   | pending-user-decision |
| ANA-009 | Scenario / what-if analysis          | Add Livestock, replace pump/light, change feeding or maintenance and estimate impacts                                 | Models, assumptions, expiry and whether scenarios persist    | pending-user-decision |
| ANA-010 | Growth projection                    | Estimate coral/plant/Livestock growth at 6/12 months                                                                  | Evidence, species model, spatial input and uncertainty       | pending-user-decision |
| ANA-011 | Capacity and overpopulation forecast | Estimate biological capacity, territory and maintenance impact                                                        | Definition of capacity and validation                        | pending-user-decision |
| ANA-012 | Operational daily briefing           | Summarize changes, trends, Care, Incidents and next events                                                            | Deterministic versus AI, cadence and personalization         | pending-user-decision |
| ANA-013 | “Do nothing” guidance                | Explicitly recommend observation/no intervention                                                                      | Evidence threshold, recheck time and responsibility          | pending-user-decision |
| ANA-014 | Decision journal                     | Record proposed change, expectation, review date and result                                                           | Domain identity, links and lifecycle                         | pending-user-decision |

## 4. Computer vision and images

| ID      | Proposal                                     | Preserved scope                                                              | Questions for user decision                                              | Status                |
| ------- | -------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------- |
| VIS-001 | Photo evidence                               | Attach photos to Observations, Livestock, Care, Incidents or Timeline        | First record type, retention, metadata and sharing                       | pending-user-decision |
| VIS-002 | Colorimetric strip/drop test reader          | White-balance/capture correction and exact manufacturer chart comparison     | Supported test/version/devices, calibration, confidence and confirmation | pending-user-decision |
| VIS-003 | Species identification                       | Rank fish, coral, invertebrate, algae or pest candidates from photo          | Taxonomy, confidence, unknown state and confirmation                     | pending-user-decision |
| VIS-004 | Individual count                             | Estimate number of organisms                                                 | Occlusion, grouping, evaluation and correction                           | pending-user-decision |
| VIS-005 | Size/biometry                                | Estimate specimen or colony size                                             | Scale reference, geometry, precision and history                         | pending-user-decision |
| VIS-006 | Growth tracking                              | Compare day 1/30/90/180 images and estimate coverage/change                  | Repeatable capture, alignment, segmentation and interpretation           | pending-user-decision |
| VIS-007 | Polyp/color/appearance tracking              | Estimate extension, colour and visible condition changes                     | Lighting normalization, labels and health interpretation                 | pending-user-decision |
| VIS-008 | Algae/cyanobacteria/dinoflagellate detection | Identify or track visible coverage                                           | Taxonomy, false positives, confidence and action                         | pending-user-decision |
| VIS-009 | Fish pathology detection                     | Detect white spot, fin damage or other visible signs                         | Health-advice policy, evaluation, referral and treatment output          | pending-user-decision |
| VIS-010 | Coral pathology detection                    | Detect bleaching, necrosis, tissue damage or irritation                      | Health-advice policy, evaluation and treatment output                    | pending-user-decision |
| VIS-011 | Photo-derived dosing adjustment              | Cross photo growth with Ca/KH consumption and alter dosing proposal/settings | Model validity, safety and whether automatic actuation is allowed        | pending-user-decision |

## 5. Livestock, compatibility and introductions

| ID      | Proposal                          | Preserved scope                                                                               | Questions for user decision                                        | Status                |
| ------- | --------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------- |
| LIV-001 | Structured Livestock Observations | Behavior, feeding, colour, damage, recovery, acclimation and quarantine                       | Vocabulary, subject relation and interpretation                    | pending-user-decision |
| LIV-002 | Contextual compatibility          | Use species, Aquarium size, number, sex, introduction order, refuges and existing inhabitants | Knowledge sources, output and uncertainty                          | pending-user-decision |
| LIV-003 | Territory/aggression analysis     | Estimate conflicts and spacing                                                                | Spatial model, species evidence and confidence                     | pending-user-decision |
| LIV-004 | Introduction planner              | Dynamic sequence for cycling, cleanup crew, fish and corals                                   | Protocol source, pause rules and keeper override                   | pending-user-decision |
| LIV-005 | Feeding model                     | Record food recipients and estimate nutrient/stock impact                                     | Quantity Units, waste assumptions and causality                    | pending-user-decision |
| LIV-006 | Guided health/diagnostic mode     | Ask targeted questions, reuse history, rank hypotheses and checks                             | Veterinary/animal-health boundary, confidence and treatment advice | pending-user-decision |

## 6. Equipment, IoT and automation

| ID      | Proposal                    | Preserved scope                                                                  | Questions for user decision                                    | Status                |
| ------- | --------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------- |
| IOT-001 | Equipment service history   | Installation, inspection, cleaning, calibration, consumables, failure and repair | Relation to Care, service vocabulary and lifecycle             | pending-user-decision |
| IOT-002 | Condition-based maintenance | Predict service from flow, drift, runtime or prior service interval              | Required sensors/history and replacement of fixed schedules    | pending-user-decision |
| IOT-003 | Home Assistant integration  | Local/API integration as device aggregator                                       | Auth, discovery, supported entities and deployment             | pending-user-decision |
| IOT-004 | MQTT integration            | Read/write local MQTT telemetry and commands                                     | Broker trust, topic contract, credentials and offline behavior | pending-user-decision |
| IOT-005 | Vendor integrations         | Sonoff, Inkbird, Chihiros, Neptune Apex, Reef Doser, GHL, Kamoer, ICA and others | Direct versus aggregator, supported use cases and maintenance  | pending-user-decision |
| IOT-006 | Read-only telemetry         | Temperature, pH, ORP, salinity, flow, level, power and other observations        | Sensor provenance, calibration, timestamps and storage         | pending-user-decision |
| IOT-007 | Predictive alerts           | Notify before telemetry or forecast crosses a condition                          | Alert policy, confidence, consent and delivery                 | pending-user-decision |
| IOT-008 | Remote Equipment commands   | Change light, flow, heating, skimmer, ATO or dosing state                        | Authorization, acknowledgement, safe state and recovery        | pending-user-decision |
| IOT-009 | Automated control           | Rules/models issue Equipment commands without immediate confirmation             | Safety, limits, audit, kill switch and liability               | pending-user-decision |

## 7. Spatial and aquascape planning

| ID      | Proposal                       | Preserved scope                                                   | Questions for user decision                              | Status                |
| ------- | ------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------- | --------------------- |
| SPA-001 | Marine 2D map                  | Place rock, zones, Equipment and Livestock approximately          | Coordinate model, accessibility and editing              | pending-user-decision |
| SPA-002 | Editable 3D model              | Model vessel, sump, hardscape, Equipment and organisms            | Technology, fidelity, mobile UX and persistence          | pending-user-decision |
| SPA-003 | Flow layer/simulation          | Show pump direction, measured flow or simulated circulation       | Input quality, CFD/approximation, validation and wording | pending-user-decision |
| SPA-004 | Light/PAR layer                | Show measured or modelled PAR and photoperiod                     | Fixture data, measurement grid, spectrum and validation  | pending-user-decision |
| SPA-005 | Territory/aggression layer     | Show zones and likely conflicts                                   | Species evidence, distances and uncertainty              | pending-user-decision |
| SPA-006 | Maintenance-access layer       | Mark cleaning, removal and hand/tool access                       | User modelling and constraints                           | pending-user-decision |
| SPA-007 | Aquascape composition guidance | Rule of thirds, proportions and hardscape variants                | Marine/freshwater variants and subjective guidance       | pending-user-decision |
| SPA-008 | Planted-light/CO2 calculator   | Plant mass, PAR, CO2 and photoperiod for freshwater planted tanks | Whether freshwater planted enters product scope          | pending-user-decision |

## 8. Care, maintenance and operational planning

| ID      | Proposal                    | Preserved scope                                                                            | Questions for user decision                                  | Status                |
| ------- | --------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | --------------------- |
| CAR-001 | Advanced recurrence         | Daily, multiple weekdays, every N days/months, monthly date, edit and pause                | Calendar semantics and backlog                               | pending-user-decision |
| CAR-002 | Reminders and notifications | In-app and push reminders with advance offsets                                             | Consent, device/account preference and delivery state        | pending-user-decision |
| CAR-003 | Quick actions               | Glass, skimmer, filter, feeding, bacteria and user-defined shortcuts                       | Immediate write versus reviewed form                         | pending-user-decision |
| CAR-004 | Personal protocols          | Versioned checklists for Water Change, calibration, acclimation and emergency              | Completion semantics and template source                     | pending-user-decision |
| CAR-005 | Guided cycling/maturation   | Protocol-specific checkpoints using inoculant, ammonia source and recorded evidence        | Supported protocols, stage authority and introduction gating | pending-user-decision |
| CAR-006 | Incident mode               | Group Measurements, Observations, photos, Care and hypotheses around a problem             | Identity, lifecycle, health language and closure             | pending-user-decision |
| CAR-007 | Absence/vacation mode       | Calculate preparation needs and days supported by ATO, food, dosers and responsible person | Safety meaning, collaborator access and reminders            | pending-user-decision |
| CAR-008 | Water Change context        | Percentage, salt batch, source water, before/after Measurements and reason                 | Stored/derived fields and causality                          | pending-user-decision |

## 9. Inventory, commerce and cost

| ID      | Proposal                   | Preserved scope                                                             | Questions for user decision                                 | Status                |
| ------- | -------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------- |
| INV-001 | Consumable inventory       | Product, amount, Unit, lot, opened/expiry dates and usage                   | Product catalogue, manual/scan entry and sharing            | pending-user-decision |
| INV-002 | Remaining-stock forecast   | Estimate ATO, reagent, dosing, food and media duration                      | Calculation method, confidence and alerts                   | pending-user-decision |
| INV-003 | Product barcode/label scan | Identify and prefill consumable/equipment product                           | Catalogue source, privacy and corrections                   | pending-user-decision |
| INV-004 | CAPEX                      | Record Aquarium, Equipment and setup purchases                              | Currency, ownership and depreciation                        | pending-user-decision |
| INV-005 | OPEX                       | Electricity, salt, food, tests, media, dosing and water costs               | Tariffs, periods, estimates and categories                  | pending-user-decision |
| INV-006 | Cost scenarios             | Compare Equipment or operating changes                                      | Duty cycle, tariff and uncertainty                          | pending-user-decision |
| INV-007 | Wish list                  | Desired fish, coral, invertebrate, Equipment or product with priority/notes | Commerce integration and privacy                            | pending-user-decision |
| INV-008 | Marketplace/opportunities  | Search, favourites, offers, stock and reservations                          | Business model, seller authority and payments               | pending-user-decision |
| INV-009 | Loyalty currency           | Earn/redeem activity and purchase rewards                                   | Incentives, expiry, accounting and care-quality effects     | pending-user-decision |
| INV-010 | Premium tiers              | Usage limits, advanced analysis, early access, discounts and shipping       | Business model, entitlements and care/commercial separation | pending-user-decision |

## 10. Knowledge, sharing and community

| ID      | Proposal                         | Preserved scope                                                                                                            | Questions for user decision                        | Status                |
| ------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------- |
| KNO-001 | Evidence-levelled Knowledge      | Separate manufacturer, official, scientific, professional, community, Aquarium observation, derivation and model inference | Evidence policy and confidence                     | pending-user-decision |
| KNO-002 | Versioned Aquarium blueprints    | Share full setup/configuration as templates with versions/forks                                                            | Privacy, ownership, application and compatibility  | pending-user-decision |
| KNO-003 | Community recipes                | Share protocols/configurations and variants                                                                                | Moderation, attribution, social features and trust | pending-user-decision |
| KNO-004 | Generic social network           | Profiles, feeds, photos, comments and interaction                                                                          | Whether this becomes a product goal                | pending-user-decision |
| KNO-005 | Read-only Aquarium sharing       | Scoped guest views                                                                                                         | Existing model evolution                           | pending-user-decision |
| KNO-006 | Scoped operational collaboration | Capability-specific writes with authorship and revocation                                                                  | Roles/permissions and correction authority         | pending-user-decision |
| KNO-007 | Public Aquarium presentation     | Publish selected Aquarium data                                                                                             | Consent, redaction, history and URLs               | pending-user-decision |

## 11. AI and Aquarium Intelligence

| ID     | Proposal                       | Preserved scope                                                               | Questions for user decision                          | Status                |
| ------ | ------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------- |
| AI-001 | General Aquarium chat          | Ask questions over Aquarium context and Knowledge                             | Provider, sources, consent, limits and evaluation    | pending-user-decision |
| AI-002 | Integrated AI across workflows | Explanations embedded in Measurement, Care, Livestock, Equipment and planning | Which workflows and whether AI is optional           | pending-user-decision |
| AI-003 | Aquarium Intelligence briefing | Daily summary of stability, rates, events, Care and observations              | Deterministic/AI split, cadence and claims           | pending-user-decision |
| AI-004 | Diagnostic hypothesis ranking  | Rank possible causes and what to check first                                  | Health boundary, evidence, confidence and treatment  | pending-user-decision |
| AI-005 | Product-aware recommendations  | Recommend products and live stock                                             | Commercial policy, conflicts of interest and consent | pending-user-decision |
| AI-006 | “No change” recommendation     | Advise observation before intervention                                        | Policy, evidence and responsibility                  | pending-user-decision |
| AI-007 | Automatic plan creation        | AI creates Care, introduction or treatment plan                               | Confirmation, writes, authority and rollback         | pending-user-decision |

## 12. Portability, explanation and product quality

| ID      | Proposal                 | Preserved scope                                                       | Questions for user decision                             | Status                |
| ------- | ------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------- | --------------------- |
| QLT-001 | CSV export               | Measurement export with Units, provenance and corrections             | Scope and formula-injection handling                    | pending-user-decision |
| QLT-002 | Versioned JSON export    | Portable Aquarium configuration/history                               | Schema, omissions and attachments                       | pending-user-decision |
| QLT-003 | PDF/print report         | Human-readable Aquarium report                                        | Content, branding and accessibility                     | pending-user-decision |
| QLT-004 | Import and restore       | Restore or migrate Aquarium data                                      | Identity remap, duplicates, dry run and rollback        | pending-user-decision |
| QLT-005 | Backup                   | User/provider backups and recovery                                    | Frequency, encryption, retention and restore guarantees | pending-user-decision |
| QLT-006 | Onboarding checklist     | Progress through account, Aquarium, Measurement, notifications and AI | Persisted completion, dismissal and truthfulness        | pending-user-decision |
| QLT-007 | Health/state explanation | Explain every status, chart, alert or hypothesis                      | Minimum explanation fields                              | pending-user-decision |

## 13. Previously agent-filtered proposals restored

The following were explicitly or implicitly rejected, excluded, renamed or
postponed by the agent before the user corrected the decision process. They are
restored above as pending decisions:

- freshwater planted and biotope product scope;
- universal biological ranges;
- Aquarium health score;
- destructive edit/delete options for history;
- custom Parameters;
- causal graph and causal Timeline terminology/behavior;
- exact or approximate chemistry, growth, capacity and flow simulations;
- pathology detection and treatment suggestions;
- photo-derived automatic dosing;
- direct vendor integrations;
- remote command and autonomous control;
- 3D hardscape and aquascape guidance;
- planted PAR/CO2 calculations;
- dynamic introduction gating;
- community recipes and generic social-network behavior;
- wish lists, marketplace, loyalty and Premium/commercial features;
- AI product placement and automatic plan creation;
- every item previously labelled `reject`, `excluded`, `outside` or “do not
  add”.

Risk and architectural consequences remain documented so the user can decide
with full information. They are not decisions on the user's behalf.

## 14. Decisions recorded by the user

### PAR-003 — ParameterDefinition domain and complete user CRUD

**Decision:** users must be able to list, view, edit, delete and create custom
properties through a complete CRUD capability. The product concept is named
`ParameterDefinition`, and it is a persisted domain of its own rather than
only a compile-time entry in the shared kernel.

**Superseding authorization decision:** keepers may create definitions and all
users may list and view the global catalogue and select definitions for their
Aquariums. Only administrators may edit or delete definitions. This narrows
the earlier generic complete-CRUD wording for security and governance.

**Still open:** definition fields, Unit model,
behavior when a definition is referenced by Measurements or Targets, sharing,
system-definition collisions and restoration/export semantics.

### PAR-002/PAR-003 — User catalogue, marketplace and Aquarium selection

**Decision:** the product will have a marketplace/catalogue of
`ParameterDefinition` items. Custom definitions belong to the global Veril
catalogue and each Aquarium has its own profile from which the keeper chooses
which definitions that Aquarium uses.

**Visibility decision:** every custom definition is public to all users
automatically when created. It does not begin as a private draft and does not
require a publication request before appearing in the marketplace.

**Consequences recorded:** a definition catalogue and an Aquarium profile are
separate concepts. A definition can exist without being enabled in every
Aquarium. The profile must not delete or make historical Measurements
unreadable when a definition is deselected.

**Scope decision:** a custom definition belongs to the global Veril catalogue
and is available to all Aquariums. Each keeper independently selects whether
to use it in each Aquarium they manage. The Aquarium profile only selects
local use; it does not duplicate, transfer or change catalogue authorship or
management permissions.

**Deletion decision:** deletion uses Veril's general mark-then-physical-delete
lifecycle. An administrator marks the definition for deletion, which removes
it from new Measurement and Aquarium-selection flows while historical
Measurements retain an embedded interpretation snapshot. A later physical
deletion is manual and confirmed by an administrator; there are no foreign-key
cascades or automatic cleanup.

**Aquarium-profile decision:** an existing selection becomes inactive but
remains recoverable when the global definition is marked for deletion. The
keeper or an administrator may remove the inactive selection. Re-enabling is
blocked until an administrator restores the definition globally; after that,
the keeper may enable it again.

**Edit/version decision:** an administrator edit creates a new definition
version and marks the previous version for deletion. Existing Measurements
retain their original definition snapshot; historical evidence is never
rewritten. The new version is the active global catalogue definition.

**Profile-version decision:** existing Aquarium profiles are not migrated when
the new version is created. They retain the old, locked reference, which is
inactive when marked for deletion. The keeper or an administrator may remove
that selection, but cannot edit it. New selections use the active version.

**Identity decision:** every `ParameterDefinition` receives a server-generated
opaque immutable technical identifier, separate from its visible name or
editable presentation code. Historical Measurements retain that identity and
version context; user-supplied names cannot create identity collisions.

### PAR-003 — Final architectural closure

**Decision:** the domain uses a stable logical `definitionId`, an immutable
server-generated `versionId` and a sequential `version` number. Aquarium
profiles store `definitionId + versionId` as denormalized NoSQL values without
foreign keys. Measurements embed a self-contained semantic snapshot including
identity/version, quantity, entered and canonical values/Units, conversion
context and method context where required. Every administrative edit,
including presentation-only changes, creates a new complete version.

Creator and administrative provenance are persisted. FIWARE/UN/CEFACT mapping
uses standard codes when available and documented mapping metadata otherwise;
Veril does not invent standard codes. The final specification is
[`PARAMETER_DEFINITION_FINAL_SPEC.md`](PARAMETER_DEFINITION_FINAL_SPEC.md).

**Implementation direction:** because Veril has no users or production data,
the hard-coded five-Parameter implementation will be replaced directly. No
compatibility migration of production Measurements is required; only source
tests and fixtures need to be updated.

FIWARE interoperability will be modelled from the beginning with established
Smart Data Models and their tested schemas/fixtures. It will not be deferred to
a later adapter phase. Veril-specific extensions remain explicit and must be
tested when introduced.

**Clarification:** `ParameterDefinition` itself is a Veril semantic catalogue
extension because there is no directly equivalent Smart Data Model. Measurements
and Digital Twin projections will reuse the closest established FIWARE
structures from the first slice, including `WaterQualityObserved`, NGSI-LD
`Property`/`Relationship`, `unitCode`, `observedAt`, Feature of Interest and
the applicable Aquaculture structures. No parallel non-standard Measurement
model will be introduced merely because the catalogue has a Veril extension.

### AquariumSystem — Aquarium as one managed system

**Decision:** an Aquarium is a managed system rather than only a display tank.
Display/containment units, sumps, refugia, treatment units, technical areas and
biological zones are components or Features of Interest within the same
system. A sump is not a second Aquarium. Measurements affect the complete
system by default and may target a component or zone explicitly.

The same boundary rule applies to auxiliary enclosures. A breeding or
spawning box inside the display tank or sump is a component; one operated
outside the system with independent water and lifecycle is a separate
AquariumSystem.

The system supports freshwater, saltwater, brackish and mixed cases, as well
as fish, coral, shrimp, snail, planted and other biological focuses. These are
independent classification dimensions rather than one mutually exclusive
Aquarium classification. The foundational model is
[`AQUARIUM_SYSTEM_MODEL.md`](AQUARIUM_SYSTEM_MODEL.md).

**Still open:** editing, moderation/review, versioning, ownership transfer,
deletion of published definitions and whether system definitions use the same
marketplace mechanism.

### PAR-025 — FIWARE and UN/CEFACT measurement direction

**Decision:** the measurement capability will be modelled around the FIWARE
standard approach and will use UN/CEFACT Common Codes for Units of Measurement.
The decision applies to custom definitions, system definitions, Measurement
records and future measurement sources, not only to an export screen.

**Recorded interoperability facts:** FIWARE Smart Data Models use harmonised
entity/property models and provide NGSIv2 and NGSI-LD representations. The
official `WaterQualityObserved` model is the closest identified water-quality
reference for aquarium measurements; FIWARE `Device`/`DeviceModel` concepts
remain relevant when a sensor or device is the source. FIWARE guidance uses
`unitCode` for non-default Units and points to three-character UN/CEFACT codes.

**Still open:** whether Veril's internal domain is natively NGSI-LD or has a
provider-neutral domain mapped to FIWARE; the exact entity/model composition;
the JSON-LD context; the mapping of aquarium-specific quantities such as dKH;
and whether Veril contributes an aquarium-specific Smart Data Model.

### SYS-001/PAR-025 — Digital Twin with observations and projected properties

**Decision:** Veril will represent the Aquarium as a Digital Twin. Quantitative
measurements/observations remain first-class immutable historical evidence with
time and provenance. The current state of the Digital Twin may additionally be
projected as current Properties compatible with the selected FIWARE/NGSI-LD
representation.

**Scope recorded:** this accepts the dual conceptual representation. It does
not yet select the complete Digital Twin fidelity, 3D model, simulation,
automation, sensor fleet or control capability.

### PAR-010/PAR-025 — Multiple input Units and canonical Digital Twin Unit

**Decision:** a `ParameterDefinition` may accept multiple compatible Units. A
Measurement preserves the value and Unit entered by the keeper or source, and
also has an equivalent normalized value in the ParameterDefinition's canonical
Unit. The Digital Twin exposes one canonical Unit per Parameter through its
projected Property.

When a `ParameterDefinition` is created, the creator configures the accepted
Units as part of the property definition. The canonical Unit is also selected
within that definition and must be compatible with the property's quantity
kind; whether it must also be one of the accepted input Units remains open.

The equivalence must be explicit and use the applicable UN/CEFACT/FIWARE Unit
code where available. The exact conversion registry, precision and
temperature-dependent conversion rules remain open and must be specified
before implementation.

The conversion logic will live in a dedicated reusable Unit-conversion module,
rather than being reimplemented in Measurements, Digital Twin projections,
imports, calculations or IoT adapters. The module will use standard Unit
identifiers where available and will distinguish fixed conversions from
context-dependent conversions.

### Measurement semantics: magnitude, method and derivation

**Decision:** the Measurement contract will distinguish the observed quantity,
value, Unit, measurement method and contextual inputs such as temperature.
Salinity, specific gravity, conductivity and density are distinct quantities,
although the UI may group them under a friendly salinity concept.

Original observations and derived values are separate. A conductivity
observation retains its original value, standard `unitCode`, time, temperature,
device, procedure and Feature of Interest. A calculated salinity result
references that observation and records its derivation method/version. The
original observation remains immutable so revised algorithms can recalculate
derived values without changing historical evidence.

**FIWARE adaptation decision:** this semantic model will be represented using
the closest available FIWARE Smart Data Model and NGSI-LD concepts, including
the observed value, `unitCode`, observation time, device/source reference and
Feature-of-Interest reference. SOSA/SSN remains the semantic vocabulary for
Observation, Property, procedure and result. The exact FIWARE entity
composition, derivation attributes and serialization format remain open.

**Metadata proportionality decision:** method, contextual inputs and
derivation metadata are required only when they are necessary to interpret a
quantity or conversion correctly. Direct deterministic Unit equivalences do
not require additional scientific metadata; Celsius and degrees centigrade are
an example. Salinity representations whose relationship depends on scale,
temperature, density, conductivity or procedure do require the relevant
metadata.

Each `ParameterDefinition` will declare the additional metadata required by
each applicable measurement method or Unit conversion. Measurement capture and
conversion will validate against that declaration and request only the context
needed for the selected method or conversion.

### Unit vocabulary

**Decision:** accepted and canonical Units will use the applicable
UN/CEFACT/FIWARE standard vocabulary. Arbitrary user-created Units are not part
of the current direction. If an aquarium-specific quantity lacks a suitable
standard Unit, the gap must be analysed and any extension explicitly mapped and
documented instead of silently inventing a Unit code.

The canonical Unit must always be one of the Units accepted for input by the
same `ParameterDefinition`.

Each Unit will also define its appropriate textual presentation: standard
symbol or scientific name, Unicode form, spacing and placement before or after
the value. This presentation metadata
is separate from the stable Unit identity and `unitCode`. The Unit
representation will not vary by interface language; Veril will always use the
scientifically appropriate standard notation and symbol.

### Measurement method catalogue

**Decision:** measurement methods will be managed through a catalogue with
stable identities and links to the closest applicable standard concepts,
including SOSA/SSN procedures where appropriate. A `ParameterDefinition` may
declare which methods apply to its quantity and which metadata each method
requires.

Methods are public to all users when created. Keepers may create methods at
minimum, including manual methods and methods associated with IoT devices or
other sources. Only moderators and administrators may edit or retire them.
Users may select available methods when configuring properties and recording
Measurements. The catalogue retains authorship and distinguishes standard
methods from keeper-created methods. Keeper-created methods are usable
immediately, even when they do not yet have a standard reference; moderators
and administrators may review or enrich that reference later. Retiring a
method must not remove it from historical Measurements. Veril will use a
strict NoSQL model: Measurements will not have foreign keys or mandatory
referential lookups. The method context required for historical interpretation
will be embedded as a snapshot in the Measurement. A stable method identifier
may be copied for provenance, but it is not a dependency required to read the
evidence. Changes to or retirement of the catalogue method cannot alter
existing historical Measurements.

### Global complete-data lifecycle rule

**Decision:** across Veril, a record may be created or edited only when it
satisfies the complete validity contract for its type. An incomplete record
cannot be created or edited, but it may be deleted. This applies to methods,
`ParameterDefinition`, Measurements and other Veril data. Historical immutable
evidence remains self-contained; valid historical Measurements are not made
deletable by this rule, while an invalid legacy record can be removed without a
referential cascade.

### Versioned completeness and validation schemas

**Decision:** every Veril data type will have a versioned completeness and
validation schema. Each persisted record will carry the schema version needed
to interpret its validity and historical shape. New schema versions may add or
change validation rules without rewriting valid historical records; every
version transition must define its migration or compatibility behavior.
`schemaVersion` is immutable for the lifetime of a record; a contract change
creates a new record with the new schema version. The previous record is not
changed in content and is marked for deletion. Migration, deletion marking and
physical deletion are separate operations.

### Global deletion visibility and purge

**Decision:** this lifecycle is the application-wide standard. A record marked
for deletion is completely invisible to ordinary users and functional flows.
Only administrators may inspect it. An administrator may request definitive
physical deletion, or a batch operation may physically delete every record
marked for deletion. No foreign keys exist in the NoSQL model, so foreign-key
cascades are impossible. The initial batch operation is manual. Future
automation through Functions, scheduled jobs or another mechanism is a later
capability. Each record applies its own deletion-state and authorization rules.
Definitive deletion of one record requires explicit confirmation for that
record. A definitive batch deletion requires one confirmation for the whole
batch, not one confirmation per record. Before confirming, the administrator
must see the batch scope, including the number of records and the list of
records selected for physical deletion. The batch continues when an individual
deletion fails. On completion it reports successes and failures and records the
result for operational follow-up. The batch result does not need to survive as
permanent audit data after the affected records have been deleted.
If physical deletion fails, the affected record remains marked for deletion so
that a later manual operation can retry it.

Marking a record for deletion updates `updatedAt` and records the administrator
identity that performed the action as lifecycle metadata. When a batch marks
multiple records, these fields are written independently on each affected
record with the operation's effective timestamp and administrator identity. If
marking one record fails, the batch continues marking the others and reports the
partial result with successes and failures. Marking a batch for deletion
requires one confirmation for the complete batch, not one confirmation per
record. This confirmation pattern is the application-wide standard for
equivalent bulk operations: before confirmation, the operator sees the scope,
record count and item list; processing is independent per item; partial
failures do not cancel the rest; and the operation reports and records its
operational result. Failed items remain retryable when the operation supports
retry.

Administrators will have a dedicated view for records marked for deletion.
That view exposes the deletion state and supports restoration or retrying
definitive physical deletion according to the authorization and confirmation
rules above. Batch warnings and execution details belong to the temporary batch
operation, not to the original record.

The administrative view supports both perspectives: records can be separated
or filtered by entity type, and administrators can also use one combined inbox
containing all marked records. It supports state filters, composable logical
filters over the applicable record fields and pagination. Selection can target
the complete result set matching the filter, not only the records visible on
the current page. Marking or deleting that selection operates on the complete
matching set, and confirmation must make that scope explicit.

When the administrator confirms an operation over all filter results, the
exact matching set is frozen for that operation. Later changes to records or to
the filter do not change its scope; the operation processes the frozen set and
reports any per-record failures.

### General batch lifecycle

**Decision:** every batch operation persists a temporary operation entity while
it is in progress. The entity contains the frozen scope and processing state.
Once the batch finishes, including with partial failures, the operation entity
is deleted. Durable per-record state needed for follow-up remains on the
affected records; the batch operation itself is not retained. If the
application closes or connectivity is lost while the batch is in progress, the
temporary entity preserves its scope and progress so the operation can resume
later. Resumption does not revalidate the current state of each record before
applying the operation. Batch operations may apply bulk modification or deletion
directly to the frozen set; reported execution warnings and failures belong to
the batch operation and do not add batch-specific fields to the original
record. Bulk modifications do not preserve a copy of each record's previous
business values; they apply the change directly and retain only the resulting
state plus applicable lifecycle metadata. Each modified record updates its own
`updatedAt` and administrator identity within the same batch operation, rather
than through a separate follow-up operation.

The temporary operation schema includes the batch identity, the affected record
schema/type, the logical frozen record IDs, processing state and all mandatory
operation metadata. The IDs and progress must be physically chunked or stored
in an `items` subcollection when the set cannot fit safely in one document. It
is the source for batch warnings and execution results while the operation
exists; it is deleted when the batch finishes. The server materializes the
frozen set at confirmation time.

```text
BatchOperation
  id
  affectedSchema
  recordIds             # logical set; physical storage may be chunked
  items                 # optional subcollection/chunk representation
  frozenScope
  processingState
  operationMetadata
  warnings
```

Bulk modification confirmation requires the operation scope and selected set,
but does not require a before/after preview of the business values.

Temporary batch-operation entities are an explicit exception to the global
persisted-data schema rule: they do not require `schemaVersion` or a versioned
completeness schema because they are operational, short-lived structures that
are deleted when the batch finishes.

Real-time progress display for an in-progress batch is optional rather than a
correctness requirement. Batch execution, resumability and final reporting
must work without it; live progress may be added when its technical and
operational cost is justified.

Interrupted or in-progress batch operations are exposed in the management
screen that created them. That contextual screen allows the administrator to
inspect and manually resume its operations; a separate global batch dashboard
is not required by this direction. A single management screen may own multiple
concurrent batch operations, each with its own frozen scope, processing state
and independent resumption capability. Batch execution is asynchronous; the
originating management screen does not wait for completion. No locking or
special conflict-management path is required. Concurrent operations use
last-applied-wins semantics: if a modification and deletion compete, deletion
wins when it is applied; if multiple modifications compete, the last applied
modification wins. This is a global Veril concurrency rule and applies to
individual operations as well as batch operations.

Deletion is terminal: if a later modification reaches a record already deleted,
it does not recreate or modify that record. The operation recognizes the
deleted state and returns a warning, not an error.

Conflict order is determined naturally by server application order and server
timestamps, never by client clocks. No additional conflict-resolution system is
required beyond the persistence behavior and the global last-applied-wins rule.

All lifecycle timestamps, including `createdAt`, `updatedAt`, deletion marks,
restoration and operation-related timestamps, are generated exclusively by the
server.

Measurement event time is separate from lifecycle time: `recordedAt` is always
the server timestamp, while `measuredAt`/`observedAt` preserves the instant
declared by the keeper, device or source and is normalized and persisted in
UTC. The server receipt time must not replace a declared observation time.

An administrator may cancel the deletion mark and restore a record while it
still exists physically; restoration clears its deletion state and returns it
to ordinary visibility and flows. Physical deletion is irreversible through the
application once completed. Restoration does not require an additional
confirmation from the administrator.
It updates `updatedAt` and records the administrator identity that performed
the restoration as lifecycle metadata, without changing business content.

### PAR-025 — Canonical internal Measurement

**Decision:** `Measurement` is the canonical internal Veril concept for one
quantitative historical reading. It is enriched with the semantic information
needed to map it to SOSA/SSN and NGSI-LD representations. `Observation` and
`Property` are interoperability/projection representations of that evidence,
not a second independent persisted source of truth.

**Recorded conceptual mapping:** `ParameterDefinition` maps to an observable
property; the value and Unit map to a result; `observedAt` maps to the time of
the reading; source, procedure, sensor and feature of interest remain explicit
fields when applicable. The current Digital Twin state is projected from
Measurements.

**Still open:** the mandatory versus optional fields for manual readings,
source/procedure/sensor identity and exact NGSI-LD/SOSA serialization. The
AquariumSystem/component/zone Feature-of-Interest hierarchy is the accepted
conceptual direction; implementation detail remains to be specified.

### PAR-025 — Extensible Feature of Interest

**Decision:** a `Measurement` may target any entity or zone represented by the
Aquarium Digital Twin as its `FeatureOfInterest`. The model is not restricted
to the AquariumSystem root; it can reference an AquariumComponent such as a
display tank, chamber, sump, refugium, technical area, biological subject or
another accepted Digital Twin object/zone.

**Scope recorded:** the reference must be extensible and identity-based rather
than an enum containing only today's Aquarium subtypes. The allowed entity
hierarchy, creation lifecycle and whether every reading requires an explicit
target remain open.

**Default target decision:** when no more specific Digital Twin entity or zone
is supplied, the `FeatureOfInterest` is the complete Aquarium system.

### Standards-first modelling principle

**Decision:** Veril will approach FIWARE Smart Data Models, NGSI-LD, SOSA/SSN
and UN/CEFACT semantics as closely as possible. Veril-specific concepts are
allowed only where those standards do not cover an aquarium requirement, and
each extension must document its relationship to the closest standard concept.

### Accepted FIWARE Aquaculture reference composition

**Decision:** the Aquarium Digital Twin will use `FishContainment` as its
closest FIWARE Aquaculture structural reference; technical treatment and
recirculation systems will reference `Sump`; water-quality readings will align
with `WaterQualityObserved` and SOSA/SSN; physical or communicating sources
will align with `Device` and `DeviceModel`; and biological context will use
`Specie` and `FishPopulation` where applicable.

This accepts the modelling direction, not a decision to copy every FIWARE
attribute or to choose a specific Context Broker, persistence format or
NGSI-LD serialization strategy.

### FIWARE Aquaculture reference discovered

The official Smart Data Models catalogue includes a `dataModel.Aquaculture`
subject. Its current models include `FishContainment` for a tank, cage, pond or
other enclosed water structure used to monitor populations and water quality,
and `Sump` for a water-treatment and recirculation unit with water-quality
properties. Related models include `Specie`, `FishPopulation`, `Feed`, `Feeder`
and `FeedingOperation`.

**Interpretation for Veril:** these are the closest discovered FIWARE domain
references for the Aquarium Digital Twin. They are aquaculture-oriented rather
than reef-aquarium-specific and currently use early model versions, so they are
reference/composition candidates rather than an unconditional copy of the
Veril domain. `WaterQualityObserved` and SOSA/SSN remain relevant for the
measurement/observation semantics.
