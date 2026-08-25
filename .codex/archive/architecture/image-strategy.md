# Future Image Strategy

This document defines conceptual boundaries only. It does not select Firebase
Storage, an image provider, an AI provider or an upload implementation.
Product-wide data handling is defined in [the privacy strategy](../product/PRIVACY.md).

## Asset lifecycle

- Retain an original only when its user value, consent and retention policy
  justify it.
- Derive thumbnails and display-optimized variants from the original; clients
  should not repeatedly download an original for small displays.
- Keep descriptive metadata separate from binary content: owner, subject,
  capture time when supplied, content type, dimensions, provenance and lifecycle
  status are candidate fields.
- Define retention, replacement, export and deletion behavior with the first
  image use case and applicable privacy requirements.

## Boundaries

- Image access follows the ownership and authorization model of the associated
  domain concept; URLs and client guards are not authorization.
- Treat images as potentially sensitive, including hidden metadata and inferred
  location or health information.
- AI processing is opt-in, has documented purpose and retention, exposes
  provenance and confidence, and never changes domain truth without confirmation.
- The domain records only the relationship and meaning needed by a use case; a
  storage implementation remains an adapter behind a port.
