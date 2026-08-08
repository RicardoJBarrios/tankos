import { ParameterId } from '../domain/measurement';

export interface MeasurementParameterPresentation {
  readonly id: ParameterId;
  readonly label: string;
  readonly unit: string;
}

export const MEASUREMENT_PARAMETER_PRESENTATIONS: readonly MeasurementParameterPresentation[] =
  [
    { id: 'temperature', label: 'Temperatura', unit: '°C' },
    { id: 'salinity', label: 'Salinidad', unit: 'ppt' },
    { id: 'alkalinity', label: 'Alcalinidad', unit: 'dKH' },
    { id: 'nitrate', label: 'Nitrato', unit: 'mg/L as NO₃' },
    { id: 'phosphate', label: 'Fosfato', unit: 'mg/L as PO₄' },
  ];

export function measurementPresentationFor(parameterId: ParameterId) {
  const presentation = MEASUREMENT_PARAMETER_PRESENTATIONS.find(
    (item) => item.id === parameterId,
  );

  if (!presentation) {
    throw new Error('Unsupported Measurement Parameter');
  }

  return presentation;
}
