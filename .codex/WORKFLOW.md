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

## Validate

Run relevant type, lint, test, build and formatting checks. Expand validation only
when a related failure requires it. Review the final diff.

## Document

Update public behavior, examples, specifications and links when they become
outdated. Reference existing information instead of copying it.

## Finish

Report the summary, changed files, validations, risks, pending decisions and
follow-up tasks. Confirm that no accidental changes remain.
