# MCP Guide

## Nx MCP

Purpose: project graph, targets, boundaries, generators and workspace metadata.
Use it for project-level questions. Do not use it instead of reading source code
or for trivial exact lookups.

## Firebase MCP

Purpose: official Firebase developer knowledge. Use it for current Firebase APIs,
Emulator Suite, Hosting, Auth, Firestore and Rules guidance. It does not replace
local emulator execution or project code.

## GitHub MCP

Purpose: repository, Issues, Pull Requests, Actions and security context. Use it
for external GitHub state. Do not place tokens in repository files.

## CodeGraph

Purpose: local structural relationships between files and symbols, including
imports, callers, callees and impact analysis. Use it after exact retrieval when
relationships add value. Do not use it for trivial string lookup.

The project registers CodeGraph in `.codex/config.toml`, using the repository as
its workspace, the `graph` profile and `graph-only` mode, and disabling
telemetry. Its executable and graph data remain outside the repository. It
ignores dependencies, builds, caches, coverage, Git metadata, logs and emulator
exports. The graph is complementary to Nx ProjectGraph, `rg` and Git.

## Permissions and limitations

These MCPs should use the minimum permissions needed for the question. MCP
availability does not authorize destructive changes, pushes, secret access or
production mutations. An unavailable MCP must fall back to local documentation,
exact search and focused file reads.
