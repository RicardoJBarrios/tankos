export const PARAMETER_IDS = [
  'temperature',
  'salinity',
  'alkalinity',
  'nitrate',
  'phosphate',
] as const;

export type ParameterId = (typeof PARAMETER_IDS)[number];

export const UNIT_IDS = [
  'celsius',
  'parts-per-thousand',
  'degrees-kh',
  'milligrams-per-litre-as-no3',
  'milligrams-per-litre-as-po4',
] as const;

export type UnitId = (typeof UNIT_IDS)[number];

export function isParameterId(value: string): value is ParameterId {
  return (PARAMETER_IDS as readonly string[]).includes(value);
}
