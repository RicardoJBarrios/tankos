# TankOS security model

## Scope

TankOS is a client-only serverless application. The browser uses Firebase
Authentication and the Firestore Client SDK directly; there is no trusted
application backend in the current free-tier architecture.

Firestore Security Rules are therefore the authoritative access boundary.
Angular guards, application policies and repository authorization improve the
user experience and fail early, but they must never be treated as a security
boundary.

## Current protections

- Firestore denies every collection not explicitly enabled.
- `units` requires a persistent authenticated user with `keeper` or `admin`.
- Private units are readable only by their owner or an admin.
- Keepers cannot modify public units.
- Unit records use a validated storage envelope and an internal `storageId`
  binding to prevent writes through an alternate document identifier.
- Revision numbers must increase exactly once per update.
- Creation metadata is preserved and update metadata identifies the caller.
- Lifecycle changes are restricted to the supported transitions.
- Provider causes are retained only as non-enumerable diagnostics; public
  error messages remain provider-neutral.
- Production builds exclude local Firebase emulator setup and credentials.

## Threat model and limits

### Client-only uniqueness limit

The application derives the Firestore document ID from a unit code and uses a
transaction to detect an existing ID. This prevents duplicate codes through
the supported application flow.

Firestore Rules cannot normalize, hash or otherwise derive that ID from an
arbitrary string. Consequently, Rules cannot prove that two independently
chosen document IDs represent the same normalized code. A malicious client
with valid write access could still bypass application code and attempt a
logical duplicate using another document ID.

This is a platform limitation of the current client-only design, not a
permission to trust the UI. If absolute uniqueness becomes a requirement,
the design must use a Firestore-safe canonical code as the document ID (with
a migration and versioning redesign), or introduce a trusted server-side
reservation mechanism. No backend is currently part of TankOS.

### Existing data migration

New writes require `data.storageId` to equal the Firestore document ID.
Existing records created before this binding was introduced must be migrated
before they can be updated under the hardened Rules. Reads remain compatible
with records that do not yet contain the field.

### Error and telemetry privacy

Library adapters must keep provider details out of user-facing messages.
Built-in console and Firebase sinks sanitize diagnostic values, but custom
third-party sinks remain responsible for applying the same policy before
exporting contexts or errors. Payloads, credentials, tokens and full provider
responses must not be sent to telemetry.

### Authentication claims

Claims are inputs to application policy and Rules evaluation. The UI must not
use them as proof of authorization independently. Only explicitly recognized
roles grant capabilities, and Firestore Rules repeat the resource boundary.

## Validation performed

- Firestore Rules integration runs against the emulator and fails if the
  emulator is unavailable.
- Attack cases cover private/public access, alternate IDs, invalid
  representation, lifecycle tampering, revision tampering and metadata
  tampering.
- Production builds are scanned to ensure local emulator markers and the local
  owner token are absent.
- Semgrep, Gitleaks and production dependency audit are required quality
  checks.

## Reassessment triggers

Review this model before adding a new collection, invitation/bearer-token
flow, file storage, Cloud Functions, a trusted backend, or a new telemetry
provider. Every new collection must start with a deny rule and have direct
Rules tests for reads, writes, cross-owner access and malformed payloads.
