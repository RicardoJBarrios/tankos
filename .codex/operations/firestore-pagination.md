# Firestore list pagination

All Firestore collection queries exposed as navigable lists use cursor-based
pagination. Offset pagination is not part of the application contract.

The shared application contract is defined in
`apps/veril/src/app/shared/application/pagination.ts`:

- default page size: 20;
- maximum page size: 50;
- opaque cursor returned by the adapter;
- `nextCursor` is absent when the page is complete.

Firestore adapters compose their domain filters and stable ordering with the
shared `readFirestorePage` helper. The helper reads at most `pageSize + 1`
documents to determine whether another page exists. Migrated domain ports
expose the generic page shape, while cursor encoding remains an infrastructure
concern; legacy bounded previews remain explicit list operations until their
screen needs navigable pagination.

Firestore Rules also require a positive `limit` no greater than 50 for list
queries. Rules cannot add a missing limit; they reject unsafe queries. The
application never exposes an offset parameter. Single document reads,
current-value lookups and bounded dashboard previews are not navigable lists
and remain separate operations.
