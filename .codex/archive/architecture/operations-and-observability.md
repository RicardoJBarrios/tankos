# Operations, Observability and Integrations

## Functional events to observe

The following events are candidates for operational or product telemetry, not an
analytics implementation:

- maintenance completed;
- water change recorded;
- feeding recorded;
- equipment failure reported;
- synchronization failed;
- offline duration and recovery;
- alert generated, acknowledged or resolved.

Events must be privacy-reviewed, minimized and separated from domain history.
Do not send raw measurements, notes or identifiers to analytics without an
explicit decision. See [the privacy strategy](../product/PRIVACY.md) for the
product-level baseline.

## Automation model

Future automation follows this conceptual shape:

```text
Trigger -> Condition -> Action
```

Each automation must define authorization, idempotency, safety limits, audit
history, retry behavior, failure notification and online/offline semantics.
There is no generic automation engine decision yet.

## Future API and integrations

Firebase is the current application boundary. Future integrations may expose
stable application contracts through REST, GraphQL, webhooks, events or an MCP
interface, but no transport is selected today.

Any future API must:

- expose view/application contracts rather than Firestore DTOs;
- preserve domain authorization and tenant ownership;
- validate inbound and outbound data with explicit schemas;
- define idempotency, versioning, rate limits and error categories;
- avoid making a provider-specific transport the domain model.

Potential integrations include device providers, export/import, notification
services and external automation. Each requires a concrete use case and ADR.

## Operational gaps

The repository still needs concrete decisions for emulator bootstrapping, seeds,
deployment promotion, backups, restore testing, incident response and production
observability before it can be considered production-ready.
