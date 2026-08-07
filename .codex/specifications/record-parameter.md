# Candidate: Record a Parameter

## Actor

An aquarium keeper; device-derived input is pending.

## Objective

Record a Parameter value relevant to an Aquarium.

## Preconditions

The Aquarium context, Parameter meaning, unit policy and authorization are
accepted.

## Main flow

The keeper records a value with the information needed to interpret it; the
system confirms the resulting record.

## Variants

Manual entry, imported input, correction and offline recording are pending.

## Expected errors

Unknown Parameter, invalid value or unit, missing context, or unauthorized
action; exact rules are pending.

## Domain events

Candidate: `MeasurementRecorded`.

## Acceptance criteria

The recorded value can later be interpreted with its Parameter, unit and time.
Correction, provenance and history semantics are accepted before implementation.
