# feedback-ui

Material adapter for the neutral `@tankos/feedback` contract.

## Responsibilities

- `FeedbackMaterialOutletComponent` renders global feedback through
  `MatSnackBar`, with automatic dismissal for transient messages and optional
  actions whose callbacks are owned by the caller.
- `MaterialConfirmationService` renders destructive confirmations through
  `MatDialog` and returns a `Promise<boolean>`.
- `provideMaterialFeedback()` registers the Material providers and the neutral
  confirmation service.

The feature and domain libraries do not depend on Material. The host chooses
this adapter, so another application can provide a different UI adapter for
the same feedback and confirmation contracts.

## Running unit tests

Run `nx test feedback-ui` to execute the unit tests.
