# Product Principles

These are permanent product principles. They guide priorities when a feature,
UX choice or technical direction conflicts with another. They do not prescribe
architecture or implementation patterns.

## Purpose

Veril helps a keeper operate and present an Aquarium through trustworthy,
understandable care information. Public presentation and private operation are
different capabilities over the same Aquarium.

## Principles

- **Evidence before interpretation.** Preserve what was observed, measured or
  done before offering an assessment of it.
- **Context before isolated data.** A value is useful with its Aquarium, time,
  subject, provenance and relevant nearby care history.
- **Calm clarity before information density.** Surface the next useful action
  and explain uncertainty instead of filling the interface with indicators.
- **Fast logging before exhaustive forms.** Ask only for information needed by
  the current operation; enrich records only when a later use case needs it.
- **User control before automation.** Important historical changes and control
  actions require explicit intent. Automation and AI remain advisory unless a
  separately accepted safety policy says otherwise.
- **Explainability before opaque intelligence.** Interpretations must remain
  attributable to their supporting evidence and must not invent data or causal
  certainty.
- **Portability before lock-in.** User records should remain understandable and
  exportable when a concrete export use case is accepted.
- **Private by default.** Public presentation is deliberate, scoped and never
  inferred from a private operational record.
- **No silent destruction.** Destructive or irreversible actions require clear
  intent, visible consequences and recovery where a use case makes it feasible.
- **Useful without AI.** AI is optional assistance, never a prerequisite for
  recording, reviewing or operating an Aquarium.
- **Direction is not timing.** An accepted architectural direction does not
  make its implementation mandatory for the current product slice.

## Non-negotiable boundaries

Veril must not fabricate care information, silently mutate important history,
turn a transient interpretation into a Fact, or make life-support decisions
without an accepted safety model and explicit human control.
