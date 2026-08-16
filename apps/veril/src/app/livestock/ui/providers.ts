import { InjectionToken } from '@angular/core';
import { LivestockReader, LivestockWriter } from '../application/ports';

export const LIVESTOCK_READER = new InjectionToken<LivestockReader>(
  'LIVESTOCK_READER',
);
export const LIVESTOCK_WRITER = new InjectionToken<LivestockWriter>(
  'LIVESTOCK_WRITER',
);
