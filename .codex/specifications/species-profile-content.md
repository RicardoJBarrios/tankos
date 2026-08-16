# Species Profile Content Contract

**Status:** Accepted for implementation.

## Purpose

A published Species Profile is shared, objective knowledge. It describes the
species, not the current condition of a Livestock record or Aquarium.

## Documentary contract

Every published profile contains:

- stable identity, accepted display name and scientific name when known;
- a concise editorial summary;
- one or more ordered content sections, each with a stable key, title and
  attributable text;
- one or more sources, including title and URL, with publication date when
  known; and
- an immutable revision identity and publication time.

Sections are content containers, not a licence to infer husbandry claims. The
editorial workflow is responsible for deciding which claims belong in each
section and how they are evidenced.

## Authoring and rendering

The editorial representation of `description` and section `content` is
Markdown. Markdown is the source of truth and is persisted as Markdown so it
can be reviewed, versioned and edited without coupling the content to the DOM.

The keeper experience parses Markdown to HTML at the presentation boundary.
Generated HTML must be rendered through Angular's sanitization path; raw
Markdown or unsanitized HTML must never be inserted into the document.

## Initial section keys

The initial template reserves these keys without requiring every profile to
contain all of them:

`identification`, `taxonomy`, `natural-history`, `morphology`, `behaviour`,
`diet`, `habitat`, `care-considerations`, `compatibility`, `reproduction`.

Unknown or unresolved knowledge must remain explicit in the section content;
it must not be replaced with inferred values.

## Boundary rules

- Only `published` profiles are returned to the normal keeper experience.
- A profile revision is immutable once published.
- Sources are part of the knowledge record, not Livestock data.
- Livestock may reference the profile identity without copying its content.
