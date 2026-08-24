# Codex Project Entry Point

Read this file first. It is the only mandatory starting point for work on Veril.

## Project

Veril is the product application managed with Nx for aquarium management across
freshwater, saltwater, brackish, planted, reef, shrimp, snail and mixed systems.
`Aquarium` is the central domain aggregate root; Veril is never an Aquarium.
Technical identifiers and documentation are written in English; Spanish is
reserved for user-facing application content.

## Mandatory reading order

1. `VISION.md` and `PROJECT_CONTEXT.md` for product intent and context.
2. `GLOSSARY.md`, `.codex/product/MENTAL_MODEL.md`,
   `.codex/product/PRODUCT_PRINCIPLES.md`, `.codex/product/UX_PHILOSOPHY.md`,
   `DOMAIN_RULES.md`, relevant product material and relevant specifications or
   aggregate discovery documents for domain work.
3. `CONSTITUTION.md` and `WORKFLOW.md` for permanent principles and process.
   Read `DEFINITION_OF_READY.md` before implementation planning and
   `DEFINITION_OF_DONE.md` before closing a vertical slice.
4. `RETRIEVAL.md` for context retrieval.
5. `CODING.md` or `TESTING.md` when implementation or tests are involved.
6. Relevant technical architecture and ADRs only after the domain context.
7. `STACK.md` and `MCP.md` when tooling or technology is involved.

Read only the documents needed for the task. Do not load the whole repository.

## Operating rules

- Use pnpm and execute workspace tasks through Nx.
- Prefer small, localized and verifiable changes.
- Reuse existing patterns and respect domain boundaries.
- Validate external data with Zod before mapping it into the domain.
- Do not expose transport DTOs directly to domain or UI code.
- Do not add dependencies, abstractions or Nx projects without justification.
- Keep library-specific documentation and architecture decisions inside that
  library's `docs` directory. Use `.codex` only for shared guardrails and
  cross-library decisions.
- Apply [`CODE_GUARDRAILS.md`](CODE_GUARDRAILS.md): public code requires TSDoc,
  and libraries require 100% coverage plus public-API breaking/contract tests.
- Do not run `git push` or `git reset --hard`.
- Never modify secrets or make destructive changes without confirmation.

## Mandatory workflow

1. Understand the request and constraints.
2. Validate that the required context exists.
3. Locate and read the minimum relevant context.
4. Analyze impact, boundaries, risks and missing information.
5. Present the standard pre-implementation summary.
6. Implement only after the context and plan are sufficient.
7. Run focused validation, review the diff and report the result.

If context is insufficient, stop and explain what is missing.

## Standard pre-implementation response

```text
Context understood:
Relevant documentation:
Relevant ADRs:
Relevant domain rules:
Affected modules:
Affected files:
Potential risks:
Missing information:
Implementation plan:
```

## Validation and definition of done

Before finishing, validate the affected types, lint, tests, build and formatting
as appropriate. The task is done only when the requested behavior is implemented,
relevant tests pass, documentation is current, the diff is reviewed and risks or
pending decisions are reported.

## Standard final response

Report:

- summary and scope;
- files created, modified or removed;
- tools and retrieval used;
- validations and results;
- risks, missing information and follow-up work.

## Pre-flight checklist

- Is the context sufficient?
- Are the glossary and domain rules understood?
- Are the relevant ADRs and boundaries known?
- Does the change already exist elsewhere?
- Is the smallest safe plan clear?

## Post-flight checklist

- Does the diff match the plan?
- Are tests and documentation sufficient?
- Were secrets and destructive operations avoided?
- Are risks and remaining decisions explicit?

## Retrieval and MCP

Start with documentation and exact local search. Use CodeGraph only for
structural symbol/import/caller/callee questions. Use Nx MCP for projects,
boundaries, dependencies, generators and targets. Use Firebase MCP and GitHub
MCP only for their external domains. See `RETRIEVAL.md` and `MCP.md`.

## Architecture

### Design precedence

```text
Vision -> Ubiquitous Language -> Use Cases -> Aggregate hypotheses
-> Domain Model -> Events -> Technical Architecture -> Persistence -> Code
```

ADRs record accepted, durable decisions at the point where they constrain this
sequence. Specifications refine an accepted use case; implementation follows
the relevant specification and ADRs. Technology and Firestore must not create
business rules by inference. Accepted feature specifications live in
`.codex/specifications/`.

The direction is:

```text
UI -> Signal Store -> application -> ports <- adapters
```

Firebase, AngularFire, Zod, Angular Material and NgRx remain outside the domain.
The target architecture is `.codex/architecture/target-architecture.md` and
accepted decisions are in `.codex/adr/`.
Conceptual domain discovery, persistence conventions and operational models are linked from
`.codex/architecture/README.md`.

## Self-review

Before implementation, use `AUDITOR.md` to check duplication, boundaries,
architecture, tests, documentation, security and maintainability.
