# Units and Quantities

No physical unit set is accepted yet. Parameters differ in meaning and the
product has no validated measurement requirements. This policy prevents an
unlabeled number from becoming domain data.

## Representation

A recorded quantity must express a numeric value and its Unit. A Parameter
defines which Units are meaningful; the canonical Unit for each Parameter is
pending acceptance.

## Precision

Record the precision supplied by the source when it affects interpretation. Do
not imply more precision through display or calculation than the source supports.
Rounding rules are specific to each accepted Parameter.

## Persistence

If a quantity is retained, retain enough information to interpret it later:
Parameter, value, Unit and relevant time. Conversion and canonicalization rules
must be accepted before they alter a retained value.

## Presentation

Present a value with its Unit and without false precision. Locale and user
preference may affect formatting but must not change the recorded meaning.
