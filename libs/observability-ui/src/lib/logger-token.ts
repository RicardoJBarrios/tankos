import { InjectionToken } from '@angular/core';
import type { Logger } from '@tankos/observability';

/** Angular composition token for the provider-neutral observability logger. */
export const LOGGER = new InjectionToken<Logger>('LOGGER');
