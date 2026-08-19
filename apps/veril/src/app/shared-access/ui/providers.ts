import { InjectionToken } from '@angular/core';
import { AquariumAccessService } from '../application/ports';
import { SharedMeasurementHistoryReader } from '../application/measurement-history-ports';

export const AQUARIUM_ACCESS_SERVICE =
  new InjectionToken<AquariumAccessService>('AQUARIUM_ACCESS_SERVICE');
export const SHARED_MEASUREMENT_HISTORY_READER =
  new InjectionToken<SharedMeasurementHistoryReader>(
    'SHARED_MEASUREMENT_HISTORY_READER',
  );
