# Feedback

Global, provider-neutral user feedback for success, information, warning and
error messages.

The library owns the message contract and an Angular signal-backed in-memory
implementation. The host application owns composition and styling. It does
not depend on Material, Firebase, a translation provider or a logging system.

Use `FEEDBACK_SERVICE` from any Angular boundary and render the Material
`FeedbackMaterialOutletComponent` once in the application shell. Feature libraries may
depend on the contract, but must not create their own global outlets.

Messages are ephemeral UI state, not telemetry and not a replacement for the
central error reporter.

## Running unit tests

Run `nx test feedback` to execute the unit tests.
