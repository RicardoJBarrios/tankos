# `feedback-ui`

## Purpose

Angular Material adapter for the neutral feedback and confirmation contracts.
It provides a global snackbar outlet and Material dialog confirmations for
destructive actions.

## Architecture

The adapter depends on `@tankos/feedback` and Angular Material. It is selected
by the composition root through `provideMaterialFeedback()`. Feature and domain
libraries depend only on the neutral contracts.

## Limits and decisions

- The outlet is intended to be mounted once in the application shell.
- Confirmation returns a decision; it does not execute the operation.
- Callback actions remain owned by the caller.
- A different host can provide another UI adapter without changing feature
  code.

## Verification

Snackbar, confirmation and provider integration behavior are covered by
Vitest Angular tests.
