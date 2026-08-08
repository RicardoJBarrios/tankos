# Retrieval Guide

Use the smallest retrieval sequence that can answer the question.

Prefer cheap retrieval first: canonical documentation, then `rg` and Git. Use
CodeGraph only when source-level relationships, callers, callees or impact are
needed. Use Nx for workspace/project relationships and the external MCPs only
for their own systems.

## Order

1. `.codex/AGENT.md`, `VISION.md`, `PROJECT_CONTEXT.md`, `GLOSSARY.md`,
   `DOMAIN_RULES.md`, relevant product material, specifications, architecture
   and ADRs.
2. Exact local search with `rg`, Git and focused file reads.
3. CodeGraph for structural relationships.
4. Nx MCP for project dependencies, boundaries, generators and targets.
5. Firebase MCP for Firebase documentation or emulator information.
6. GitHub MCP for repository, issue, pull request and Actions information.

## Rules

- Start with symbols, paths or exact text, not a repository-wide scan.
- Read only the fragments needed to answer or implement the task.
- Do not reread content already in context.
- Ignore dependencies, builds, caches, coverage and generated artifacts.
- Use CodeGraph for callers, callees, imports, implementations and impact.
- Do not use CodeGraph for trivial exact string lookup.
- Use CodeGraph before moving a domain concept, changing a public interface or
  application port, modifying an aggregate or ownership boundary, renaming a
  use case, removing a shared component, or performing a multi-file refactoring
  where structural impact matters.
- For isolated templates, styles and local implementation changes, prefer not
  to invoke CodeGraph.
- Use Nx MCP for project-level relationships; do not substitute it with source
  graph queries.
- Use external MCPs only when local documentation cannot answer the question.
- Expand context incrementally and state why expansion was necessary.

## Context validation

Before implementation, confirm that the following are available when relevant:

- project context understood;
- relevant architecture read;
- relevant ADRs read;
- glossary and domain rules reviewed;
- existing implementation reviewed;
- affected tests reviewed;
- CodeGraph consulted when structural relationships add value;
- Nx graph reviewed when project boundaries or targets matter;
- related documentation reviewed.

If any required item is missing, stop and state what is missing before editing.

## Fallback

If a tool is unavailable or returns incomplete relationships, use `rg`, Git and
Nx as appropriate, report the unavailability once, and continue. Stop only if
the missing structural analysis is genuinely required for a safe decision. Do
not add another retrieval system merely because a query was inconvenient.
