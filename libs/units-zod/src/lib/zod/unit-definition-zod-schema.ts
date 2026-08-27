import {
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
  type UnitDefinition,
} from '@tankos/units';
import { z } from 'zod';

const representationSchema = z.strictObject({
  symbol: z.string().min(1),
  asciiFallback: z.string().min(1),
  position: z.enum(['prefix', 'suffix']),
  spacing: z.enum(['none', 'narrow', 'normal']),
});

/** External JSON shape accepted for a unit definition. */
export const unitDefinitionDtoSchema = z.strictObject({
  code: z.string(),
  ownerId: z.string().min(1).optional(),
  ownerName: z.string().min(1).optional(),
  codeSearchTokens: z.array(z.string().min(1)).optional(),
  ownerSearchTokens: z.array(z.string().min(1)).optional(),
  visibility: z.enum(['private', 'public']).default('public'),
  system: z.enum([
    'si',
    'metric',
    'british-imperial',
    'us-customary',
    'custom',
  ]),
  representation: representationSchema,
  catalogueVersion: z.string().min(1),
});

/** External JSON shape returned for a unit definition. */
export type UnitDefinitionDto = z.input<typeof unitDefinitionDtoSchema>;

/** Parses a transport unit definition into an immutable domain value. */
export const unitDefinitionSchema = unitDefinitionDtoSchema.transform(
  (value, context): UnitDefinition | typeof z.NEVER => {
    try {
      return createUnitDefinition({
        code: createUnitCode(value.code),
        ...(value.ownerId === undefined ? {} : { ownerId: value.ownerId }),
        ...(value.ownerName === undefined
          ? {}
          : { ownerName: value.ownerName }),
        visibility: value.visibility,
        system: value.system,
        representation: createUnitRepresentation(value.representation),
        catalogueVersion: value.catalogueVersion,
      });
    } catch (error) {
      context.addIssue({ code: 'custom', message: String(error) });
      return z.NEVER;
    }
  },
);
