# Veril Mental Model

**Status:** canonical conceptual model. The definitions marked **accepted** are
part of the shared domain language. All cardinalities, invariants and behavior
not explicitly accepted remain hypotheses.

## Product and domain

**Veril is the product:** the application used to present and operate managed
marine-aquarium care. It is never an `Aquarium`, `Display`, `System` or a
particular ecosystem.

**Aquarium is the central domain concept and aggregate root.** It represents a
manageable care system. It does not imply a user, a SaaS tenancy, one Aquarium,
multiple Aquariums or a particular storage model.

The first Aquarium created in this project will be named **Veril**. That is the
name of one domain instance, not a redefinition of the product or domain. The
first experience may begin with that real Aquarium, while the domain supports
independent Aquariums without a product-level maximum.

Public presentation and private operation are different application capabilities
over the same Aquarium. They do not create separate models, domains or sources
of truth.

For the MVP, Firebase Anonymous Auth may provide the authenticated application
identity used by the first private flow. It is not a domain identity model;
linking, recovery and durable human identity are deferred.

## Core concepts

| Concept        | Definition and responsibility                                                                                                                                                        | Classification                                                                       | Status               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------- |
| Aquarium       | The managed care system to which care, records, life and supporting systems are related. It is the aggregate root and the center of meaning.                                         | Aggregate root; Entity                                                               | accepted             |
| Display        | A physical, observable water-and-life area related to an Aquarium.                                                                                                                   | Entity only if a use case needs identity or lifecycle; otherwise descriptive concept | hypothesis           |
| System         | A coherent set of physical, biological or technical elements that supports an Aquarium. It is not automatically an aggregate or a database hierarchy.                                | Domain concept; possible Entity only when needed                                     | hypothesis           |
| Equipment      | A device or item that supports, observes or acts on an Aquarium or System. It is not a controller authority, sensor record or automation by itself.                                  | Entity only when identity/lifecycle is needed                                        | hypothesis           |
| Livestock      | Organisms cared for in relation to an Aquarium. Individual/group identity, association and lifecycle are unresolved.                                                                 | Entity only when a use case needs it                                                 | hypothesis           |
| Measurement    | A quantitative Observation of a Parameter at a time.                                                                                                                                 | Recorded evidence; possible Entity only when identity/correction requires it         | candidate            |
| Observation    | A qualitative or quantitative account of an observed subject or condition.                                                                                                           | Recorded evidence; possible Entity only when identity/correction requires it         | candidate            |
| Fact           | Durable, immutable, attributable evidence accepted by the system. It retains provenance and occurrence or recording time; it does not claim complete certainty about Aquarium state. | Conceptual evidence category                                                         | accepted             |
| Event          | A Fact whose occurrence has independent domain meaning in an accepted use case. It classifies that Fact; it is not a second generic record.                                          | Domain occurrence; not every Fact becomes an Event                                   | candidate per event  |
| Interpretation | A human or derived assessment of Facts, Observations or Events.                                                                                                                      | Derived assessment; never replaces source evidence                                   | accepted distinction |
| Knowledge      | Curated, attributable understanding used to inform care, such as a documented procedure or source reference. It is not automatically a rule, Fact or Event.                          | Documentary/reference concept                                                        | accepted distinction |
| Timeline       | A chronological read model that helps review evidence and relevant occurrences for an Aquarium.                                                                                      | Read Model                                                                           | accepted concept     |
| Active Context | The application scope from which a person views or operates on an Aquarium.                                                                                                          | Application context; not a domain model element                                      | accepted             |

## Relationship model

```text
Aquarium [aggregate root]
  ├─ may relate to Display(s)                 [cardinality pending]
  ├─ may be supported by System(s)             [cardinality pending]
  ├─ may relate to Equipment and Livestock     [rules pending]
  └─ is the subject of care records and history

Measurements, Observations and Events describe or occur in relation to an
Aquarium and, when relevant, a more specific subject. Timeline projects them.
Interpretations and Knowledge may refer to evidence but do not rewrite it.
```

The external aquarium corpus demonstrates why `Display` and `System` must not
be casually collapsed: a visible water-and-life area can be supported by
technical zones and equipment. It does not establish their final cardinality,
ownership or persistence representation in Veril.

## Evidence, history and truth

| Category        | Role                                                                                                                                                                               | Source of truth?                                                                                | Timeline treatment                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Facts           | Durable, immutable, attributed evidence about a recorded value, action or state. Provenance and occurrence or recording time are mandatory; preserve both when distinct and known. | Yes, within the accepted retention/correction policy.                                           | Included when relevant.                                       |
| Observations    | Perceived, measured or reported evidence; Measurements are quantitative Observations. They become Facts only when an accepted use case records them durably.                       | Yes only as accepted durable records of what was observed or measured, not as infallible state. | Included when relevant.                                       |
| Events          | Domain-significant Facts. Every Domain Event is itself a Fact, rather than an automatic additional Fact record.                                                                    | Yes, when an accepted specification defines the occurrence.                                     | Included when relevant.                                       |
| Interpretations | Explicit assessment, hypothesis or derived explanation.                                                                                                                            | No; it is traceable to evidence but does not replace it.                                        | May be shown only when clearly labelled and attributable.     |
| Knowledge       | General or curated understanding that informs action.                                                                                                                              | No for an individual Aquarium's history.                                                        | Not a historical item by default; it may be cited as context. |

This preserves the useful care loop evidenced by the external corpus: observe or
measure, record an intervention, then evaluate the result. It does not justify
diagnosis, causal certainty, autonomous control or a global event-sourcing
model.

Once a Fact is accepted durably, its original claim, provenance and time are not
silently edited. A later correction, qualification or withdrawal is new,
attributable evidence linked to the earlier Fact when the relevant use case
accepts that relationship. Interpretations may be revised, but never replace
their sources. Retention and correction policies beyond this rule remain
per-use-case decisions.

## Timeline as product axis

The Timeline should be the primary **review** surface, not the only product
surface. It makes the product's promise concrete: understand what changed in an
Aquarium and what evidence surrounds that change.

- A focused Timeline answers “what happened around this time or subject?”
- Parameter history answers “how did this quantity vary?”
- An overview answers “what deserves attention now?” without becoming a generic
  dashboard.

The Timeline is a read model, never an independent source of truth. It contains
relevant Facts, Observations and Events; it may display Interpretations only as
distinct, attributable material. Its filters, ordering, retention and visibility
rules remain use-case decisions.

## Systems: useful lens, not a premature hierarchy

The proposed split below is useful as a discovery lens:

```text
Aquarium
├── Physical System
├── Biological System
├── Technical System
├── Maintenance
├── Measurements
├── Observations
└── Timeline
```

It must **not** be adopted as a domain tree now. It mixes three different kinds
of thing: system aspects (physical, biological, technical), care activity
(Maintenance), evidence (Measurements and Observations) and a projection
(Timeline). Turning each row into an Entity, aggregate, Firestore collection or
Nx library would create needless complexity.

Use the three system aspects only to ask better questions about an Aquarium.
Keep Maintenance, Measurements and Observations as concepts whose identity and
lifecycle follow accepted use cases. Keep Timeline as a read model.

## Active Context

Active Context is the application-level scope from which a person interprets or
operates on an Aquarium. It can select an Aquarium and, only when useful, a
Display, System, Equipment item, Livestock subject, period or view.

It is **not** an Entity, Aggregate, authorization decision, persistence model,
Firestore document or domain rule. It changes what is in view, not what the
Aquarium is or who is allowed to act. With multiple Aquariums, selection remains
an application concern and does not change this definition.

## Classification boundaries

- **Entities:** only concepts that require stable identity and lifecycle in an
  accepted use case. `Aquarium` is accepted; the others remain conditional.
- **Value Objects:** `AquariumId` and `AquariumName` are accepted for
  establishment. `AquariumId` is opaque and stable; `AquariumName` is a
  non-empty trimmed label. Quantity/unit, time and provenance remain candidates
  when equality, validation or behavior is needed.
- **Aggregates:** `Aquarium` is the sole accepted aggregate root. No child
  aggregate, consistency boundary or cross-Aquarium rule is accepted.
- **Domain Services:** none are accepted. Compatibility, eligibility,
  interpretation or control must not become services before a validated policy
  requires cross-concept behavior.
- **Policies:** provenance, correction, history, ownership, privacy, offline
  and intervention safety are per-use-case policies, not assumed invariants.
- **Read Models:** Timeline, focused parameter history and an Aquarium overview
  answer different questions; none owns the domain truth.

## Evidence from the real aquarium corpus

The corpus at `acuario/` is domain evidence. It reveals concepts, vocabulary,
processes and needs such as provenance, time, interventions, incidents,
configuration changes, observation, equipment supervision and gradual care.

It must never be copied as a generic data model, Firestore design, entity list,
architecture, equipment catalogue, species catalogue, parameter target or
technical decision. Its concrete Veril scenario is one future Aquarium instance
and a rich source of examples, not the product specification.

Incorporate a corpus insight only through the affected specification, glossary
or policy when the product accepts the corresponding need.

## First accepted slice

`Establish an Aquarium` creates only the Aquarium root. Its minimum identifying
information is a name; Display, System, Equipment and Livestock are deferred.
The actor is an authenticated keeper and the new Aquarium is private by default.
The successful establishment creates one durable Fact classified as the
`AquariumEstablished` Domain Event. It is online-required.

The first product version may contain only the first real Aquarium in its initial
experience, but that is not a domain cardinality rule and does not decide
collaboration, equipment, Livestock, automation, offline mutation policy or
Firestore shape.
