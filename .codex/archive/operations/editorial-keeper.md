# Editorial Keeper Provisioning

Species Profile editing is controlled by the Firebase custom claim
`editorialAdmin: true`.

## Grant or revoke access

Run the provisioning tool from a trusted operator environment with Firebase
Admin SDK Application Default Credentials configured:

```text
pnpm firebase:set-editorial-claim <firebase-uid> grant
pnpm firebase:set-editorial-claim <firebase-uid> revoke
```

The tool preserves unrelated custom claims and refuses anonymous Firebase
users. It does not accept a UID from the browser or expose Admin credentials
to Angular.

The operator must have permission to administer Firebase Authentication. In a
deployed environment this should run from a protected CI job or operator
machine using the project service account; credentials must not be committed
to the repository.

After a claim changes, the account must sign in again or refresh its ID token
before Firestore Rules observe the new role. The client is allowed to hide or
show editorial controls as a convenience, but `firestore.rules` remains the
authorization boundary.
