import { UnitCodeError } from '../errors';

/** Opaque public reference to a unit in a qualified standard namespace. */
export type UnitCode = string & { readonly __unitCode: unique symbol };

const UNIT_CODE_PATTERN = /^[A-Za-z][\w\-./]*:[0-9A-Za-z][\w\-.]*$/u;

/** Creates a validated, qualified unit code such as `UN/CEFACT:LTR`. */
export function createUnitCode(value: string): UnitCode {
  if (typeof value !== 'string' || !UNIT_CODE_PATTERN.test(value)) {
    throw new UnitCodeError(value);
  }

  return value as UnitCode;
}
