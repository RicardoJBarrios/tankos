import { InjectionToken } from '@angular/core';
import type { UnitDefinitionManagementService } from '@tankos/units';

/** Application composition token; this package contains no feature UI. */
export const UNIT_DEFINITION_MANAGEMENT_SERVICE =
  new InjectionToken<UnitDefinitionManagementService>(
    'UNIT_DEFINITION_MANAGEMENT_SERVICE',
  );
