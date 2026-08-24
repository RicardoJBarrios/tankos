import {
  createDimensionSignature,
  createQuantityKind,
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
  type UnitDefinition,
} from '@tankos/units';
import { z } from 'zod';

const baseDimensionSchema = z.strictObject({
  length: z.number().int(),
  mass: z.number().int(),
  time: z.number().int(),
  temperature: z.number().int(),
  amountOfSubstance: z.number().int(),
  electricCurrent: z.number().int(),
  luminousIntensity: z.number().int(),
});

const representationSchema = z.strictObject({
  symbol: z.string().min(1),
  asciiFallback: z.string().min(1),
  position: z.enum(['prefix', 'suffix']),
  spacing: z.enum(['none', 'narrow', 'normal']),
});

/** External JSON shape accepted for a unit definition. */
export const unitDefinitionDtoSchema = z.strictObject({
  code: z.string(),
  system: z.enum([
    'si',
    'metric',
    'british-imperial',
    'us-customary',
    'custom',
  ]),
  dimension: baseDimensionSchema,
  quantityKind: z.string().min(1),
  representation: representationSchema,
  conversionFamily: z.string().min(1),
  catalogueVersion: z.string().min(1),
  status: z.enum(['active', 'deprecated', 'retired']),
});

/** External JSON shape returned for a unit definition. */
export type UnitDefinitionDto = z.input<typeof unitDefinitionDtoSchema>;

/** Parses a transport unit definition into an immutable domain value. */
export const unitDefinitionSchema = unitDefinitionDtoSchema.transform(
  (value, context): UnitDefinition | typeof z.NEVER => {
    try {
      return createUnitDefinition({
        code: createUnitCode(value.code),
        system: value.system,
        dimension: createDimensionSignature(value.dimension),
        quantityKind: createQuantityKind(value.quantityKind),
        representation: createUnitRepresentation(value.representation),
        conversionFamily: value.conversionFamily,
        catalogueVersion: value.catalogueVersion,
        status: value.status,
      });
    } catch (error) {
      context.addIssue({ code: 'custom', message: String(error) });
      return z.NEVER;
    }
  },
);
