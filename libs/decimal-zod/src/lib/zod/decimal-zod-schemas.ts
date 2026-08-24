import { z } from 'zod';
import {
  createDecimalContext,
  normalizeDecimalInput,
  ROUNDING_MODES,
  type DecimalContext,
  type DecimalInput,
  type DecimalValue,
} from '@tankos/decimal';

/** Zod schema for a canonical DecimalValue at an external boundary. */
export const decimalValueSchema: z.ZodType<DecimalValue> = z
  .string()
  .transform((value, context) => normalizeDecimal(value, context));

/** Zod schema for user or form input accepted by Decimal. */
export const decimalInputSchema = z
  .union([z.string(), z.number()])
  .transform((value, context) => normalizeDecimal(value, context));

/** Zod schema for a validated, immutable decimal operation context. */
export const decimalContextSchema: z.ZodType<DecimalContext> = z
  .strictObject({
    decimalPlaces: z.number(),
    rounding: z.enum(ROUNDING_MODES),
  })
  .transform((value, context) => {
    try {
      return createDecimalContext(value.decimalPlaces, value.rounding);
    } catch (error) {
      context.addIssue({
        code: 'custom',
        message: String(error),
      });
      return z.NEVER;
    }
  });

function normalizeDecimal(
  value: DecimalInput,
  context: z.RefinementCtx,
): DecimalValue | typeof z.NEVER {
  try {
    return normalizeDecimalInput(value);
  } catch (error) {
    context.addIssue({
      code: 'custom',
      message: String(error),
    });
    return z.NEVER;
  }
}
