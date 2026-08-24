/** Rounding behavior applied when a decimal operation cannot be exact. */
export type RoundingMode = (typeof ROUNDING_MODES)[number];

/** Supported rounding modes exposed by the Decimal contract. */
export const ROUNDING_MODES = [
  'up',
  'down',
  'half-up',
  'half-even',
  'ceil',
  'floor',
] as const;
