/* c8 ignore file -- lazy composition glue is exercised by the browser E2E suite. */
import { inject, type Provider } from '@angular/core';
import { TIME_CLOCK } from '@tankos/time';
import { createUnitDefinitionManagementService } from '@tankos/units';
import { createDefaultUnitDefinitionFirestoreRepository } from '@tankos/units-firestore';
import { UNIT_DEFINITION_MANAGEMENT_SERVICE } from '@tankos/units-composition';
import { tankosFirestore } from './firebase';

/** Firebase composition loaded only when the units feature is requested. */
export function provideTankosUnits(): Provider {
  return {
    provide: UNIT_DEFINITION_MANAGEMENT_SERVICE,
    useFactory: () =>
      createUnitDefinitionManagementService(
        createDefaultUnitDefinitionFirestoreRepository({
          firestore: tankosFirestore,
          clock: inject(TIME_CLOCK),
        }),
      ),
  };
}
