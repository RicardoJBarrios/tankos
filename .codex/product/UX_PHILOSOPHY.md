# UX and Visual Philosophy

This document defines interaction and visual direction. It does not prescribe
screens, components, tokens or a design system.

## Interaction principles

- Keep repeated care actions calm, direct and progressively disclosed.
- Prefer inline editing for a small, local correction with immediate context;
  use a focused form when information, validation or consequences need review.
- Avoid modal-first flows. Use a modal only when focus, confirmation or an
  irreversible decision cannot be explained safely in context.
- Require explicit intent for destructive actions. Prefer reversible actions or
  a clear recovery path where the accepted use case permits one.
- Do not apply hidden background mutations to historical records.
- Optimistic UI is allowed only for an accepted operation whose offline and
  consistency policy permits it; pending, failed and cached state stays visible.
- Offer undo only when it is semantically safe. Undo must not conceal a durable
  historical correction or conflict.
- Explain loading, empty and error states with the impact and next available
  action. Do not use empty visual space as the only explanation.

## Visual direction

- Favor a calm, readable interface over a dense instrument panel.
- Use color for meaning, not decoration: neutral for ordinary information,
  restrained emphasis for attention, and a distinct destructive state for risk.
- Do not imply health, safety or urgency from color alone; text and semantics
  must carry the meaning.
- Establish clear typography hierarchy so Aquarium context, current task and
  evidence can be scanned without relying on decoration.
- Keep spacing and density sufficient for reading records, comparing values and
  operating controls without accidental activation.
- Use charts only when a time-based question benefits from them. Preserve unit,
  provenance, range context and uncertainty; a chart must not imply causality.
- Use icons as supporting cues, with accessible labels unless they are purely
  decorative.
- Motion is purposeful, short and optional. Respect reduced-motion preferences.
- Design responsively from narrow screens outward; zoom and touch interaction
  must retain access to core actions.
- Dark mode is a future product decision. Do not add partial support.

## Accessibility baseline

Meet WCAG 2.2 AA where applicable. Every accepted feature must preserve semantic
HTML, keyboard navigation, visible focus, labels, usable contrast, adequate touch
targets, responsive zoom and announced status/error feedback for assistive
technology. Test the affected interaction manually before introducing dedicated
accessibility tooling.

## Language

User-facing content is Spanish. Code, technical identifiers and technical
documentation remain English.

## Current UI foundation

Angular Material 3 is the presentation foundation for the current application.
Use its theme tokens for color, typography, density and shape before adding
local visual values. The initial theme is light-only; dark mode remains a
future product decision rather than a partial implementation.

Keep layouts responsive from narrow screens outward, use Material components
only where they improve the current interaction, and keep product-specific
layout in feature CSS. Do not create a shared component library, Storybook or
visual-regression baseline until repeated semantics and visual stability justify
them. Tests must assert Veril behavior and accessibility, never Material's
internal DOM or CSS classes.
