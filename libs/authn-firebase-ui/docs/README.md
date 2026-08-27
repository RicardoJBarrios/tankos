# `@tankos/authn-firebase-ui`

## Purpose

`@tankos/authn-firebase-ui` provides the Angular UI for the Firebase
email/password sign-in flow. It uses the provider-neutral `AuthSessionPort`
for authentication, so Firebase SDK calls remain in `@tankos/authn-firebase`.

## Architecture

```text
@tankos/authn
  AuthSessionPort and credentials contract
        ^
@tankos/authn-firebase
  Firebase Auth adapter
        ^
@tankos/authn-firebase-ui
  Angular login page
```

The component preserves safe `returnUrl` navigation and exposes stable
`data-testid` hooks for integration tests. Product applications provide the
route, branding and localized copy around it.

## Limits and security

- The component supports email/password only.
- It does not contain Firebase SDK calls or Firebase error-code handling.
- The return URL accepts only internal paths beginning with `/`.
- Authentication and authorization enforcement remain in the configured
  session adapter and server-side security rules.

## Testing

Run `nx test authn-firebase-ui` for the complete component suite and
coverage report.
