import { ParameterId } from '../domain/parameter-reference';

export interface ParameterPresentation {
  readonly id: ParameterId;
  readonly label: string;
  readonly unit: string;
}

export const PARAMETER_PRESENTATIONS: readonly ParameterPresentation[] = [
  { id: 'temperature', label: 'Temperatura', unit: '°C' },
  { id: 'salinity', label: 'Salinidad', unit: 'ppt' },
  { id: 'alkalinity', label: 'Alcalinidad', unit: 'dKH' },
  { id: 'nitrate', label: 'Nitrato', unit: 'mg/L as NO₃' },
  { id: 'phosphate', label: 'Fosfato', unit: 'mg/L as PO₄' },
];

export function parameterPresentationFor(parameterId: ParameterId) {
  const presentation = PARAMETER_PRESENTATIONS.find(
    (item) => item.id === parameterId,
  );

  if (!presentation) {
    throw new Error('Unsupported Measurement Parameter');
  }

  return presentation;
}
