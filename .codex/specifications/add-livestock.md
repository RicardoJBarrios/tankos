# Accepted: Add Livestock

**Status:** Accepted for implementation.

## Actor

An aquarium keeper.

## Objective

Record and review a Livestock record associated with an Aquarium so care
information has context. A record may represent one organism or a group and
references the encyclopedic Species Profile for its species.

## Preconditions

The keeper is authenticated and has an owned Aquarium in Active Context. The
Species Profile identity, Livestock identity, individual/group distinction and
owner-scoped authorization are accepted. Species Profiles are global, shared,
curated and attributable knowledge; they are not owned by a keeper or Aquarium.
Livestock records remain Aquarium-specific.

## Main flow

The keeper selects a Species Profile, records the Livestock identity and
whether it represents an individual or group. The system associates it with the
selected Aquarium and confirms the active lifecycle state.

## Variants

- An individual identifies one organism; a group identifies multiple organisms
  represented by one record. For example, one clownfish is an individual and a
  zoanthus colony is a group.
- One global Species Profile may be referenced by many individual or group
  records and many Aquariums.
- A keeper may transfer the record to another Aquarium they own. The previous
  association remains in history and the record becomes active in the
  destination Aquarium.
- Removing Livestock is a soft delete. The record and its historical
  associations remain available for traceability, but it is not shown as
  active.
- The lifecycle begins as `active`; transfer preserves lifecycle history and
  removal moves the record to `removed`. Further lifecycle states are deferred.

## Expected errors

Missing Species Profile or Livestock identity, invalid individual/group data,
unavailable Aquarium, unauthorized transfer or invalid lifecycle transition.

## Domain events

`LivestockAssociated`, `LivestockTransferred` and `LivestockRemoved` are
accepted domain occurrences when their respective operations commit.

## Acceptance criteria

The application can maintain globally shared, curated Species Profiles and
the keeper can create and list individual and group Livestock linked to them in
an owned Aquarium. The keeper can transfer Livestock to another owned Aquarium
and remove it without losing the record or association history. Active views
exclude removed records while traceability views can identify the complete
lifecycle.

## Deferred scope

- advanced species taxonomy and scientific identification beyond the Species
  Profile reference;
- the Species Profile editorial workflow, sources, review and publication
  permissions;
- quantities beyond the individual/group distinction;
- photos, notes and attachments;
- lifecycle states beyond `active` and `removed`;
- associating Observations, Measurements or Care Work with Livestock; and
- sharing Aquariums or transferring Livestock to another keeper.
