import { DurationCalculationPort } from './duration-calculation-port';
import { InstantCalculationPort } from './instant-calculation-port';
import { IntervalCalculationPort } from './interval-calculation-port';
import { LocalDateCalculationPort } from './local-date-calculation-port';

/** Port for deterministic calculations over normalized temporal values. */
export interface TemporalCalculationPort
  extends
    InstantCalculationPort,
    DurationCalculationPort,
    IntervalCalculationPort,
    LocalDateCalculationPort {}
