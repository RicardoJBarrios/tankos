import { CalendarPort } from './calendar-port';
import { DurationPort } from './duration-port';
import { InstantPort } from './instant-port';
import { TimeZonePort } from './time-zone-port';
import { TemporalCalculationPort } from './temporal-calculation-port';

/** Complete temporal port used when an application needs every capability. */
export type TimePort = InstantPort &
  DurationPort &
  CalendarPort &
  TimeZonePort &
  TemporalCalculationPort;
