import { UnitCodeError } from '../errors';
import { createUnitCode } from './unit-code';

describe('createUnitCode', () => {
  it.each(['UN/CEFACT:LTR', 'TANKOS:CUSTOM-SCOOP', 'standard.v1:unit_01'])(
    'Given a valid qualified code %s, When created, Then preserves it',
    (value) => {
      expect(createUnitCode(value)).toBe(value);
    },
  );

  it.each([
    '',
    '   ',
    'UN/CEFACT',
    ':LTR',
    'UN/CEFACT:',
    'UN/CEFACT LTR',
    'UN/CEFACT:LTR ',
    ' UN/CEFACT:LTR',
    'UN,CEFACT:LTR',
    'UN/CEFACT:LTR/extra',
    null,
    undefined,
  ])(
    'Given an invalid code %s, When created, Then throws UnitCodeError',
    (value) => {
      expect(() => createUnitCode(value as never)).toThrow(UnitCodeError);
    },
  );
});
