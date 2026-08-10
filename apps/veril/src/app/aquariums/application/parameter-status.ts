import { ParameterTarget } from '../domain/aquarium';
import { CurrentMeasurementValue } from './aquarium-ports';

export type ParameterStatus = 'below' | 'within' | 'above';
export type ParameterInterpretation = ParameterStatus | 'uninterpreted';

export interface CurrentParameterState {
  readonly parameterId: CurrentMeasurementValue['parameterId'];
  readonly measurement: CurrentMeasurementValue | null;
  readonly target: ParameterTarget | undefined;
  readonly interpretation: ParameterInterpretation | undefined;
}

export function parameterStatusFor(
  canonicalValue: number,
  target: ParameterTarget,
): ParameterStatus {
  if (canonicalValue < target.minimum) {
    return 'below';
  }

  if (canonicalValue > target.maximum) {
    return 'above';
  }

  return 'within';
}

export function currentParameterStateFor(
  parameterId: CurrentMeasurementValue['parameterId'],
  measurement: CurrentMeasurementValue | null,
  target: ParameterTarget | undefined,
): CurrentParameterState {
  if (!measurement || measurement.canonicalValue === null) {
    return {
      parameterId,
      measurement: null,
      target,
      interpretation: undefined,
    };
  }

  return {
    parameterId,
    measurement,
    target,
    interpretation: target
      ? parameterStatusFor(measurement.canonicalValue, target)
      : 'uninterpreted',
  };
}
