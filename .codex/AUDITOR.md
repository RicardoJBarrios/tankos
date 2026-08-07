# Pre-implementation Auditor

Before changing code, ask:

- Does this already exist?
- Am I duplicating code, configuration or documentation?
- Which ADRs and boundaries apply?
- Does the change preserve dependency direction?
- Is there a simpler solution?
- Am I introducing an abstraction, library or dependency prematurely?
- Are external inputs validated with Zod?
- Are DTOs separated from domain and view models?
- Are tests appropriate for the affected layer?
- Does public behavior require documentation updates?
- Are security, privacy, accessibility and offline implications understood?
- Does the change preserve the free-first and reproducible-environment policies?
- Can the impact be validated with focused retrieval?
- What facts are observed, and what remains a hypothesis?

Stop and expand the plan when the answers reveal an unresolved architectural,
security or destructive-change risk.
