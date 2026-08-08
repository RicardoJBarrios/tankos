# Development Workflow

## Understand

Read the request, separate objectives from constraints, locate related code and
load the minimum context. Identify nearby configuration, documentation, tests,
risks and ambiguity. Do not scan the whole repository by default.

## Analyze

Determine impact, direct and indirect dependencies, affected modules, related
ADRs and existing patterns. Distinguish observed facts from hypotheses.

## Plan

Summarize the plan, affected files, validations and risks. Justify transversal
changes and request confirmation when scope or reversibility changes materially.

## Implement

Keep the change small, reuse patterns, avoid unrelated refactors and review each
edit for accidental changes.

When several slices repeat the same mechanic, remove obvious local duplication
continuously and perform a focused consolidation pass after several slices or
when repetition becomes evident. Abstract only demonstrated common concepts;
do not DRY distinct domain concepts merely because their implementations look
similar. Three explicit domain implementations are preferable to one generic
abstraction with the wrong meaning.

DRY applies to duplicated knowledge or policy, not merely repeated syntax.
Share a policy when its consumers must evolve together; share an implementation
only when its semantics are identical. Do not hide domain vocabulary behind
generic APIs, and let abstractions follow evidence rather than anticipation.

## Validate

Run relevant type, lint, test, build and formatting checks. Expand validation only
when a related failure requires it. Review the final diff.

## Document

Update public behavior, examples, specifications and links when they become
outdated. Reference existing information instead of copying it.

## Finish

Report the summary, changed files, validations, risks, pending decisions and
follow-up tasks. Confirm that no accidental changes remain.
