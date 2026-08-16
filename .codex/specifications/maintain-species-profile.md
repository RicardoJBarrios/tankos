# Accepted: Maintain Species Profile

**Status:** Accepted for implementation.

## Product value

The keeper can consult a shared encyclopedic Species Profile when identifying
Livestock. The profile provides attributable general knowledge without being
presented as the current condition, diagnosis or guarantee for an Aquarium.

## Ownership and visibility

Species Profiles are global knowledge. They are not owned by a keeper or an
Aquarium and are readable wherever a Livestock record references them.

Ordinary keepers cannot publish or silently overwrite Species Profiles. Profile
maintenance belongs to an editorial authority that is separate from Aquarium
ownership. The editorial authority is a persistent keeper account carrying the
Firebase custom claim `editorialAdmin: true`.

### Access policy

- An anonymous user may read published Species Profiles.
- A signed-in, persistent keeper with the Firebase custom claim
  `editorialAdmin: true` is the editorial keeper authorized to maintain
  profiles.
- An anonymous user and an authenticated keeper without that claim cannot
  create, update, publish, retire or delete a profile.
- The claim is assigned only from a privileged Firebase Admin SDK environment;
  it is never assigned by the Angular client.

## Editorial lifecycle

```text
draft -> reviewed -> published -> retired
draft -> retired
```

- `draft` is not presented as established knowledge in the normal keeper
  experience.
- `reviewed` has passed the editorial review required by the project policy but
  is not necessarily visible until publication.
- `published` is the canonical profile referenced by normal Livestock flows.
- `retired` remains available for historical references but is not selectable
  for new Livestock records.

The profile identity remains stable across revisions. Publishing a correction
creates a new immutable revision and does not erase the previous published
content. A Livestock record references the Species Profile identity and the
revision used for its identification when that historical decision is known.

## Minimum documentary contract

Each published profile must have:

- a stable species identity;
- an accepted display name and the scientific name when known;
- the documented content sections required by the editorial template;
- one or more attributable sources, with source date when available;
- revision identity, editorial status and publication time; and
- a clear distinction between sourced fact, interpretation and unresolved
  knowledge.

The content template, source-quality hierarchy and review checklist are a
separate editorial decision. This specification does not invent biological
claims or species-specific husbandry values.

## Relationship with Livestock

- A Livestock record must reference one published Species Profile when it is
  created through the normal keeper flow.
- Many Livestock records may reference the same Species Profile.
- Species Profile changes do not rewrite Livestock identity, Aquarium
  association or lifecycle history.
- Removing or transferring Livestock does not remove or alter the Species
  Profile.

## Deferred scope

- ordinary keeper editing or proposals;
- administrative role implementation;
- full species taxonomy and synonym management;
- automatic biological recommendations;
- species-specific Parameter Targets;
- importing external catalogues automatically; and
- using a Species Profile as evidence about an individual Aquarium.
