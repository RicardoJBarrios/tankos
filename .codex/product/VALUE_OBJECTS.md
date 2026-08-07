# Candidate Value Objects

These concepts may become Value Objects if an accepted use case requires their
equality, validation or behavior. They are not implementation types.

| Candidate | Purpose | Questions to validate |
| --- | --- | --- |
| Aquarium name | Identify an Aquarium for people. | Requiredness, uniqueness, length and change behavior. |
| Parameter value | Express a measured quantity. | Unit, precision, acceptable range and correction semantics. |
| Measurement time | Identify when information was observed or recorded. | Observation versus recording time, timezone and source. |
| Care-work intention | Describe planned care. | Required meaning, schedule, recurrence and completion. |
| Provenance | Explain where information came from. | Manual, device or imported sources and trust level. |
| Alert condition | Describe why attention is requested. | Severity, threshold, acknowledgement and resolution. |

Do not introduce a Value Object merely because a field exists; introduce one
when the domain needs its behavior or invariants to be explicit.
