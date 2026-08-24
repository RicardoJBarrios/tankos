import type { ConversionKind, ConversionOrigin } from './conversion-definition';
import type { UnitCode } from './unit-code';

/** Filter used by the custom conversion catalogue management flow. */
export interface ConversionDefinitionFilter {
  readonly code?: string;
  readonly sourceUnit?: UnitCode;
  readonly targetUnit?: UnitCode;
  readonly family?: string;
  readonly kind?: ConversionKind;
  readonly origin?: ConversionOrigin;
}
