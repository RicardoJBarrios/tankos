# Keeper access

Private Aquarium ownership and all Aquarium-associated records require a
persistent Firebase Auth user with the custom claim `isKeeper: true`.

Grant or revoke the claim from a privileged Firebase Admin SDK environment:

```sh
pnpm firebase:set-keeper-claim <firebase-uid> grant
pnpm firebase:set-keeper-claim <firebase-uid> revoke
```

The Angular client cannot assign the claim. The user must sign in again or
refresh the ID token after a change. Anonymous users can only use explicitly
public or anonymous-readable surfaces; they cannot create or read private
Aquarium data.
