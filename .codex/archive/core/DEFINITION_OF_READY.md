# Definition of Ready

A specification is ready for implementation when the applicable criteria below
are explicit enough to build and validate the smallest useful change. This is a
proportional gate: a small local change needs only the criteria it touches; a
new durable domain capability must satisfy the full relevant set.

## Product and domain

- Its status is `Accepted`, its actor is known, and its user value is clear.
- Its scope, preconditions, success outcome and observable acceptance criteria
  are bounded.
- Meaningful failure cases, canonical terminology, relevant domain rules and
  required invariants are known.
- Important open questions are explicitly non-blocking; unresolved questions
  must not be implemented by inference.

## Architecture and data

- The affected aggregate or boundary, application impact and relevant ADRs are
  understood.
- Persistence follows the domain rather than defining it; required reads,
  writes, reconstruction data and concurrency behavior are known when durable
  data is involved.
- The offline class, security/privacy impact and authorization boundary are
  classified when applicable.

## Delivery

- The smallest implementation and validation path is clear, including the
  relevant tests and documentation impact.
- A larger or cross-boundary change has a concise plan, affected areas and risks
  recorded before implementation.

## Applying this definition

Do not require ADRs, persistence design, emulator tests or E2E for a purely
local change that does not need them. Conversely, a private durable write is not
ready without its authorization, persistence and validation decisions.
