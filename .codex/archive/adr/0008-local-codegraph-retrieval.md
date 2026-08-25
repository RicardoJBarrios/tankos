# ADR-0008: Local structural CodeGraph retrieval

## Status

Accepted

## Context

Exact search is the default retrieval method, but impact analysis sometimes needs
symbol, import, caller and callee relationships. Nx ProjectGraph answers project
boundaries, not source-level symbol relationships.

## Decision

Use CodeGraph 0.19.1 as optional local developer tooling outside the workspace.
Register its MCP server with Codex in `graph` profile and `graph-only` mode for
structural retrieval. Exclude generated files, caches, dependencies, logs and
emulator exports. Keep the index outside the repository and disable telemetry.

Use CodeGraph only after documentation and exact local search, and only when a
structural question adds value. Continue using Nx MCP for project/library graph,
boundaries and targets. Do not introduce hosted graph services, embeddings,
vector databases or generic RAG.

## Consequences

- Caller, callee, import and impact questions can use a persistent local graph.
- CodeGraph remains complementary to `rg`, Git and Nx rather than replacing them.
- The graph consumes local disk and must be rebuilt or refreshed when necessary.
- Structural-only mode avoids model downloads and remote services.

## Alternatives considered

- Exact search alone: retained as the first step, but insufficient for all impact
  questions.
- Previous semantic retrieval tooling: rejected after it provided no measured
  retrieval improvement in the A/B test.
- Hosted graph, vector RAG or database-backed retrieval: rejected as unnecessary.
