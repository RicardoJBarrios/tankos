# TankOS Decimal

**Status:** first runtime slice implemented; Units integration remains pending.

`Decimal` is the reusable TankOS capability for exact decimal input,
arithmetic, comparison, precision and rounding. It is independent from Units,
Measurements, money, Firestore and any presentation locale.

## Purpose and boundary

`Decimal` owns:

- canonical decimal values;
- input normalization and validation;
- decimal arithmetic ports;
- precision and rounding contexts;
- typed arithmetic errors;
- replaceable arithmetic adapters;
- Angular providers and application facades;
- contract and adapter tests.

`Decimal` does not own:

- units or physical dimensions;
- unit conversion formulas;
- measurements or observations;
- money semantics;
- localized number formatting;
- Firestore or JSON transport DTOs;
- statistical, matrix or general symbolic mathematics.

The dependency direction is:

```text
Decimal core
  <- big.js adapter

Units -> Decimal ports
Measurements -> Decimal + Units
Angular composition -> Decimal application/adapters
```

The core must not depend on Angular, Firebase, Firestore, Units, Time or
`big.js`.

## Decimal representation

The canonical value is a decimal string:

```ts
type DecimalValue = string & { readonly __decimalValue: unique symbol };
```

Strings are used because they preserve the decimal representation at external
boundaries and are safe to persist or transport. JavaScript `number` may be
accepted as an input convenience, but it is normalized immediately and is not
used for arithmetic.

Exact values should enter through strings. A number that has already lost
precision before reaching the library cannot be recovered by the adapter.

Accepted input examples:

```text
0
35
-0.5
1.0264
1e-6
```

Normalization rules:

- scientific notation is accepted and normalized;
- `-0` becomes `0`;
- no locale-specific decimal separator is accepted at the core boundary;
- leading/trailing whitespace is rejected rather than silently trimmed;
- empty strings and ambiguous numeric formats are rejected.

Rejected values include:

```text
NaN
Infinity
-Infinity
null
undefined
""
"   "
"1,25"
"0x10"
"abc"
```

## Arithmetic adapter

The reference implementation uses [`big.js`](https://github.com/MikeMcl/big.js/)
7.x. It is an implementation detail of the arithmetic port. Big.js is packaged
through the separate `@tank-os/decimal/big-js` entry point; the primary package
also exports the factory required by that secondary entry point.

The adapter is replaceable through a port:

```ts
interface DecimalArithmeticPort {
  add(...operands: DecimalOperands): DecimalValue;
  subtract(...operands: DecimalOperands): DecimalValue;
  multiply(...operands: DecimalOperands): DecimalValue;
  divide(left: DecimalValue, right: DecimalValue, context: DecimalContext, ...additionalDivisors: DecimalValue[]): DecimalValue;
  remainder(left: DecimalValue, right: DecimalValue): DecimalValue;
  power(base: DecimalValue, exponent: DecimalValue, context?: DecimalContext): DecimalValue;
  negate(value: DecimalValue): DecimalValue;
  compare(left: DecimalValue, right: DecimalValue): -1 | 0 | 1;
}
```

The arithmetic methods accept at least two operands. Addition and multiplication
are accumulated left to right; subtraction and division apply each following
operand to the current result in order. Division keeps the existing compatible
signature, with the explicit context before any additional divisors, and uses
that context for every division in the chain.

JavaScript and TypeScript do not support operator overloading. Decimal therefore
exposes explicit equivalents for the standard arithmetic operators: `add` (`+`),
`subtract` (`-`), `multiply` (`*`), `divide` (`/`), `remainder` (`%`), and
`power` (`**`). `negate` represents unary `-`. The API intentionally does not
coerce values through JavaScript `number` arithmetic.

`power` accepts integer decimal exponents, including negative integers. A
non-integer or unsafe exponent is rejected by the adapter boundary. Negative
exponents require an explicit `DecimalContext`; otherwise the operation would
silently depend on mutable provider precision. Non-negative integer powers do
not require a context because they are exact multiplications.

## Fluent arithmetic

`DecimalService` is the only application entry point for arithmetic. It creates
an immutable `Decimal`, and every operation returns a new `Decimal`. `Decimal`
is exported as a type contract; its runtime value object and factory are
application-internal. There is no public constructor or `Decimal.create()`
factory. This keeps
grouping and precedence visible in TypeScript without an expression parser:

```ts
const result = service.decimal('2.5').add('1.5').multiply('3')
  .subtract('2').divide('3', service.context(2, 'half-up'));

// result.value === '3.33'
```

Every operation returns a new immutable `Decimal`; the preceding value is not
modified. A `Decimal` from the same configured service can also be passed as an
operand. The fluent API does not implement `valueOf()` intentionally, so using
`+`, `-`, `*` or `/` raises a `TypeError` instead of silently converting the
value to JavaScript number arithmetic or concatenating strings. `String(value)`
and `JSON.stringify(value)` use the canonical decimal string.

Use intermediate variables when a formula has domain meaning, such as
`subtotal`, `scaled` or `average`. Domain services should own named formulas
and their business rules.

Only the Big.js adapter imports `big.js` and maps its exceptions to typed Decimal
errors. Consumers using the reference implementation import
`provideTankOsDecimalWithBigJs()` from `@tank-os/decimal/big-js`. Consumers with
another engine import `provideTankOsDecimal()` from the core entry point and
provide their own `DecimalArithmeticPort`. A future implementation may use
another decimal engine without changing Units or consuming domains.

## Precision and rounding

Precision of calculation is separate from precision of display. Arithmetic does
not round implicitly.

```ts
type DecimalContext = {
  decimalPlaces: number;
  rounding: RoundingMode;
  readonly __decimalContext: unique symbol;
};
```

`DecimalContext` is an opaque value type at the TypeScript boundary. Callers
must create it with `createDecimalContext()`; the returned object is frozen at
runtime. This prevents unvalidated literal contexts from bypassing the
rounding contract.

## Zod boundary adapter

The optional `@tank-os/decimal/zod` entry point provides runtime schemas without
adding Zod to the Decimal core. It exposes:

- `decimalValueSchema`: accepts transport strings and returns a canonical
  `DecimalValue`;
- `decimalInputSchema`: accepts the wider `string | number` input contract for
  forms and commands;
- `decimalContextSchema`: validates and freezes a `DecimalContext`.

Persistence and JSON/HTTP adapters should use `decimalValueSchema` and store
decimal values as strings. The Zod adapter does not import Firestore, HTTP or
`big.js`.

The initial rounding modes are:

```text
up
down
half-up
half-even
ceil
floor
```

Addition, subtraction and multiplication preserve the exact representable
decimal result. Division requires an explicit `DecimalContext`, expressed as a
maximum number of decimal places and a rounding mode. The implementation must
not rely on a mutable process-wide precision setting; each operation receives
its effective context and the context object is immutable at runtime.

Display formatting may round only through explicit presentation options. The
Decimal core never applies locale formatting or display precision.

## Errors

The public API maps failures to typed errors, including:

- invalid decimal input;
- non-finite input;
- division by zero;
- invalid decimal-place context;
- unsupported rounding mode;
- arithmetic overflow or adapter failure;
- incompatible context.

Provider-specific errors must not cross the port boundary. Adapter failures are
mapped to `DecimalAdapterError`, retaining only the safe operation metadata
without exposing provider-specific error types or causes in the contract.
Results outside the Decimal limits use `DecimalRangeError`, which is distinct
from invalid input.

## Input and resource limits

The public normalizer rejects inputs that could create unbounded allocations or
unusable persisted values. The current limits are:

- exponent magnitude: at most `1_000`;
- input and canonical serialized length: at most `4_096` characters;
- no trimming, locale conversion or implicit coercion.

These are Decimal contract limits, not `big.js` configuration. The `Decimal`
value object and each adapter validate their runtime boundary. An adapter may
have stricter operational capabilities and must report unsupported contexts as
`DecimalAdapterError` rather than leaking its own exception type. Arithmetic
results that exceed the contract are reported as `DecimalRangeError`.

## Angular-centric integration

The core remains framework-independent. Angular composition provides the
adapter and application facade:

```text
Decimal ports and value types
  -> DecimalService
  -> provideTankOsDecimalWithBigJs()
  -> Angular consumers
```

The public Angular API uses `inject()`. It does not expose constructor
injection, `Big` instances or mutable global configuration. `DecimalService` is
provided by the selected provider composition at the same injector scope as the
arithmetic port; it is not an unconditional root singleton. This allows a
consumer to select a different adapter in a child application scope without
reusing a service bound to the root adapter.

## Initial implementation slices

Implementation is intentionally incremental:

1. decimal value parser and normalizer;
2. rounding modes and contexts;
3. arithmetic port and `big.js` adapter;
4. typed errors and boundary mapping;
5. Angular provider and service;
6. contract tests and adapter tests;
7. fluent integration consumed by Units.

Units then owns physical compatibility and conversion functions. Decimal does
not know what a litre, kilogram or salinity is.

## Testing contract

Every executable source file has a paired test file. Tests use Given/When/Then
style and separately describe each public element and behavior.

The matrix covers:

- finite numbers and decimal strings;
- scientific notation;
- zero and negative zero;
- negative values;
- `NaN`, positive and negative infinity;
- `null` and `undefined`;
- empty strings, whitespace and locale separators;
- special characters and malformed formats;
- exact addition, subtraction and multiplication;
- non-terminating division;
- division by zero;
- each rounding mode;
- precision boundaries and invalid contexts;
- adapter failures and repeated calls;
- Angular provider configuration.

The library target enforces 100% lines, statements, functions and branches.
The type-only port declaration and type-only barrels have no runtime coverage;
their shape and public import path are covered by compile-time contract tests.
There is no source exclusion list.

The adapter tests also cover all sign combinations relevant to directional
rounding, invalid direct adapter inputs, provider-limit failures and division
by zero, and forged contexts. Service tests cover fluent value creation,
numeric inputs and context creation; arithmetic behavior is tested on the
fluent `Decimal` value object and the adapter contract.

The `build` target uses `@nx/angular:ng-packagr-lite` and emits the primary
package plus the `big-js` and `zod` secondary entry points under
`dist/libs/tank-os/decimal`. It is a package-boundary check, not a database or
HTTP client build. Public entry-point tests pin the supported import paths and
the adapter composition contract.

Run `pnpm nx run decimal:build` to compile the library or
`pnpm nx run decimal:test` to execute the 100% V8 coverage gate.

Any future arithmetic adapter must satisfy the complete
`DecimalArithmeticPort` contract: every operation receives canonical finite
decimal values, returns a canonical finite decimal value (except `compare`),
and maps unsupported or provider-specific failures to the Decimal error model.
The Big.js adapter tests are the executable reference for these semantics.

## Non-goals

The first Decimal implementation does not add:

- Units or Measurements;
- financial currency rules;
- locale-aware display pipes;
- arbitrary scientific functions;
- matrix or vector arithmetic;
- Firestore persistence;
- HTTP or FIWARE adapters.
