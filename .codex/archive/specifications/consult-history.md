# Candidate: Consult care history

## Actor

An aquarium keeper.

## Objective

Review relevant past care information for an Aquarium.

## Preconditions

The Aquarium context, accessible records and authorization are accepted.

## Main flow

The keeper requests past information; the system presents the records that the
accepted history policy makes relevant.

## Variants

Time range, record types, cached information and incomplete history are pending.

## Expected errors

Unknown context, no accessible records or unavailable information; exact
conditions are pending.

## Domain events

None; consulting history does not itself establish a domain occurrence.

## Acceptance criteria

The keeper can distinguish available information from absent, stale or pending
information. Scope, order and retention are accepted before implementation.
