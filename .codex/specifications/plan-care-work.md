# Candidate: Plan care work

## Actor

An aquarium keeper.

## Objective

Record an intention to perform care work in the relevant care context.

## Preconditions

The care context, work meaning and authorization are accepted.

## Main flow

The keeper records the intended work; the system makes that intention available
for later review.

## Variants

Recurring work, reminders, delegation, cancellation and completion are pending.

## Expected errors

Missing care context, insufficient information or unauthorized action; exact
conditions are pending.

## Domain events

Candidate: `CareWorkPlanned`.

## Acceptance criteria

The keeper can distinguish planned work from completed work. Lifecycle and
history semantics are accepted before implementation.
