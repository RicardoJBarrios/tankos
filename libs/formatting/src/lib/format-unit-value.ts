export interface UnitValueRepresentation {
  readonly symbol: string;
  readonly position: 'prefix' | 'suffix';
  readonly spacing: 'none' | 'narrow' | 'normal';
}

export function formatUnitValue(
  value: number | string,
  representation: UnitValueRepresentation,
): string {
  const spacing = representation.spacing === 'none' ? '' : ' ';
  const textValue = String(value);
  return representation.position === 'prefix'
    ? `${representation.symbol}${spacing}${textValue}`
    : `${textValue}${spacing}${representation.symbol}`;
}
