# Candidate Lifecycle States

No lifecycle is accepted yet. These diagrams identify questions that a use-case
specification must resolve before implementation.

## Care work

```text
planned -> completed
planned -> cancelled
```

Whether `completed` or `cancelled` can change, and whether other states exist,
is pending.

## Alert

```text
detected -> acknowledged -> resolved
detected -> resolved
```

The meaning of detection, acknowledgement, severity and resolution is pending.

## Livestock association

```text
associated -> no longer associated
```

Transfer, loss, removal, grouping and historical retention are pending.

## Equipment association

```text
associated -> no longer associated
```

Installation, activation, shared use and failure states are pending.
