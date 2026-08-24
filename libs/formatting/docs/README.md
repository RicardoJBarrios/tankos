# Formatting

`@tankos/formatting` contains small, framework-neutral formatters shared by
TankOS libraries. It does not own domain concepts, parsing, persistence or
localization.

## Public formatters

- `trimTrailingZeros(value)` removes trailing ASCII `0` characters from
  already formatted text without parsing the value.
- `padLeft(value, width, fillCharacter?)` pads text to a minimum width and
  validates the width and fill character.

The library is deliberately independent from `Time` and `Decimal`. Domain
libraries decide what their values mean; this library only performs the final
text formatting operation.

## Quality boundary

The test target requires 100% V8 coverage for lines, statements, functions and
branches. Each public formatter has one implementation file and one matching
behavior-focused spec file. The public entrypoint has a separate contract
test.
