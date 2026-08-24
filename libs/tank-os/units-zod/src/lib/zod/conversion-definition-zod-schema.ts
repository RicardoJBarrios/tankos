import {
  createConversionDefinition,
  createUnitCode,
  type ConversionDefinition,
} from '@tank-os/units';
import {
  createDecimalContext,
  normalizeDecimalInput,
  ROUNDING_MODES,
} from '@tank-os/decimal';
import { z } from 'zod';

const decimalInputSchema = z.union([z.string(), z.number()]).refine((value) => {
  try {
    normalizeDecimalInput(value);
    return true;
  } catch {
    return false;
  }
}, 'Must be a finite decimal number');

const factorSchema = z.strictObject({
  numerator: decimalInputSchema,
  denominator: decimalInputSchema,
});

const offsetSchema = z.union([decimalInputSchema, factorSchema]);

const divisionContextSchema = z.strictObject({
  decimalPlaces: z.number(),
  rounding: z.enum(ROUNDING_MODES),
});

/** External JSON shape accepted for a conversion definition. */
export const conversionDefinitionDtoSchema = z.strictObject({
  code: z.string(),
  version: z.string(),
  origin: z.enum(['standard', 'custom']),
  sourceUnit: z.string(),
  targetUnit: z.string(),
  family: z.string(),
  kind: z.enum(['linear', 'affine']),
  factor: factorSchema,
  offset: offsetSchema,
  divisionContext: divisionContextSchema.optional(),
  provenance: z.string(),
});

/** External JSON shape returned for a conversion definition. */
export type ConversionDefinitionDto = z.input<
  typeof conversionDefinitionDtoSchema
>;

/** Parses a transport conversion into an immutable domain value. */
export const conversionDefinitionSchema =
  conversionDefinitionDtoSchema.transform(
    (value, context): ConversionDefinition | typeof z.NEVER => {
      try {
        return createConversionDefinition({
          ...value,
          sourceUnit: createUnitCode(value.sourceUnit),
          targetUnit: createUnitCode(value.targetUnit),
          divisionContext: value.divisionContext
            ? createDecimalContext(
                value.divisionContext.decimalPlaces,
                value.divisionContext.rounding,
              )
            : undefined,
        });
      } catch (error) {
        context.addIssue({ code: 'custom', message: String(error) });
        return z.NEVER;
      }
    },
  );
