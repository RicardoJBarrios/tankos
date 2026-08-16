import { InjectionToken } from '@angular/core';
import { AquariumAccessService } from '../application/ports';

export const AQUARIUM_ACCESS_SERVICE =
  new InjectionToken<AquariumAccessService>('AQUARIUM_ACCESS_SERVICE');
