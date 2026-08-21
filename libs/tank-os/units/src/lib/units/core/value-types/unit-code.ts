import { UnitCodeError } from '../errors';

/** Opaque public reference to a unit in a qualified standard namespace. */
export type UnitCode = string & { readonly __unitCode: unique symbol };

const UNIT_CODE_PATTERN =
  /^[A-Za-z][A-Za-z0-9./_-]*:[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** Creates a validated, qualified unit code such as `UN/CEFACT:LTR`. */
export function createUnitCode(value: string): UnitCode {
  if (typeof value !== 'string' || !UNIT_CODE_PATTERN.test(value)) {
    throw new UnitCodeError(value);
  }

  return value as UnitCode;
}
