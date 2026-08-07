# Backup, Export and Restoration Strategy

This document defines functional expectations only; it selects no format,
provider, backup job or restoration mechanism.

## Export

A keeper should be able to obtain the care information they are entitled to
access in a documented, understandable form. The scope, authorization,
completeness, image treatment and retention of exports are pending.

## Import

An import must identify its source, validate information before it affects care
records, explain unresolved conflicts and avoid silent overwrites. Supported
sources and merge behavior require a concrete use case.

## Restoration

Restoration must be authorized, traceable and explicit about what information is
replaced, retained or unavailable. It must not silently erase newer care data.
Recovery objectives and the distinction between user restoration and operational
backup recovery are pending.
