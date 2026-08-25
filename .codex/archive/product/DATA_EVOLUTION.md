# Conceptual Data Evolution

This is an evolution policy, not a migration design.

- Preserve the meaning of previously recorded information when a definition,
  Unit, lifecycle or rule changes.
- Identify the effective point of a change and make any changed interpretation
  understandable to the person reviewing history.
- Prefer additive, reversible evolution while old and new meanings coexist.
- Before an irreversible change, define authorization, notice, export, recovery
  and retention implications.
- Validate transformations against representative synthetic data and the accepted
  use case before applying them to user information.
- Do not silently reinterpret, discard or fabricate historical care information.

Specific migration steps, formats and technical mechanisms remain pending until
an accepted model change requires them.

## Contract evolution

- Version every published or used business contract whose meaning, validation,
  representation, conversion, authorization or lifecycle may change. This
  includes Units, ParameterDefinitions, measurement methods, conversion
  functions and future equivalent catalogues.
- Keep technical `schemaVersion` separate from the immutable business
  `versionId`/`version` of a published definition.
- Never edit a published or used business version in place. Create a complete
  replacement version with a new immutable identity and move the previous
  version through `deprecated` or `retired` lifecycle states.
- Existing records must preserve the exact version and enough bounded snapshot
  data to remain interpretable without a live catalogue lookup.
- Physical deletion is reserved for drafts or versions proven never to have
  been published or used. Published historical definitions are normally
  retained, even when they are unavailable for new selections.
- Prefer additive, backward-compatible changes. Validate and map old external
  representations at the boundary; domain behavior must not depend on a
  provider's document shape.
- Use staged read-old/write-new behavior only when both representations must
  coexist. Define the end condition and removal plan before introducing it.
- Backfills and migration scripts require representative synthetic data,
  idempotence where reruns are possible, observability of failures and a safe
  rollback or recovery plan.
- User-visible changes require an explanation when they alter historical
  interpretation, permissions, export, retention or recovery expectations.

Do not introduce migration infrastructure or backfills merely because a
technical schema version exists. Add them only when an accepted persisted
contract requires a representation migration. Business versioning of published
definitions is mandatory independently of migration tooling.
