# Future AI Architecture

This document describes a future direction only. It does not authorize AI
features, model dependencies, data collection or hosted services today.
Product-wide data handling is defined in [the privacy strategy](../product/PRIVACY.md).

## Candidate capabilities

- image analysis and coral identification;
- disease or anomaly detection;
- maintenance recommendations;
- parameter trend prediction;
- automation assistance;
- natural-language navigation and explanation.

## Boundaries

AI must remain outside the domain core and operate through explicit application
ports. It may recommend or classify, but must not silently mutate Aquarium,
Measurement, Maintenance or Security truth.

Every capability would require:

- explicit user consent where data leaves the device or project;
- provenance and confidence surfaced to the user;
- human confirmation for consequential actions;
- privacy review for images, notes and measurements;
- evaluation datasets and failure criteria;
- cost, latency and availability limits;
- auditability and rollback of recommendations.

## Data policy

Do not send personal data, private aquarium data or images to an AI provider by
default. Prefer local or project-controlled processing only if it meets quality,
privacy and cost requirements. No model, provider, embedding service or vector
database is selected.

## Pending decisions

- Which capabilities have measurable user value.
- Whether recommendations may use historical Measurements or Events.
- Retention and deletion of prompts, images and outputs.
- Human review and safety requirements for automation assistance.
- Evaluation ownership and acceptable false-positive/false-negative rates.
