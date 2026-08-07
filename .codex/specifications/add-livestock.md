# Candidate: Add Livestock

## Actor

An aquarium keeper.

## Objective

Associate Livestock with an Aquarium so care information has context.

## Preconditions

The Aquarium context, Livestock identity model and authorization are accepted.

## Main flow

The keeper records the association; the system confirms it for future care
context.

## Variants

Individual versus group, transfer, removal and lifecycle history are pending.

## Expected errors

Missing identity, invalid association or unauthorized action; exact conditions
are pending.

## Domain events

Candidate: `LivestockAssociated`.

## Acceptance criteria

The keeper can identify the Livestock association in the relevant Aquarium
context. Ownership and lifecycle semantics are accepted before implementation.
