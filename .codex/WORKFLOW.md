# Development Workflow

## Understand

Read the request, separate objectives from constraints, locate related code and
load the minimum context. Identify nearby configuration, documentation, tests,
risks and ambiguity. Do not scan the whole repository by default.

## Analyze

Determine impact, direct and indirect dependencies, affected modules, related
ADRs and existing patterns. Distinguish observed facts from hypotheses.

Choose the cheapest tool that can answer the question: canonical documentation
for documented rules, `rg` for exact symbols or text, Git for history and
evolution, CodeGraph for source-level relationships, Nx for workspace
boundaries, and the Firebase or GitHub MCP for their respective external
systems. CodeGraph complements these tools; it is not a default step.

Before changing a public interface, application port, aggregate, ownership
boundary, use-case name or shared component, use CodeGraph to inspect callers,
callees, dependencies and impact when the change is expected to cross files.
For isolated templates, styles or local implementation changes, do not add a
graph query merely for ceremony.

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
Before introducing an abstraction, use structural evidence to identify its real
consumers when the change is transversal. Abstract because evidence of a shared
concept exists, not merely because code is repeated.

## Validate

Run relevant type, lint, test, build and formatting checks. Expand validation only
when a related failure requires it. Review the final diff.

## Document

Update public behavior, examples, specifications and links when they become
outdated. Reference existing information instead of copying it.

## Finish

Report the summary, changed files, validations, risks, pending decisions and
follow-up tasks. Confirm that no accidental changes remain.

If CodeGraph is unavailable or returns incomplete relationships, report it once
and continue with `rg`, Git and Nx as appropriate. Stop only when structural
analysis is genuinely required for a safe decision.
