import { ComparisonResult, DurationInput } from '../value-types';

/** Port for ordering normalized elapsed durations. */
export interface DurationCalculationPort {
  /** Compares two elapsed durations using three-way ordering. */
  compareDurations(left: DurationInput, right: DurationInput): ComparisonResult;
}
