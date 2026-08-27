import type { Route } from '@angular/router';
import { inject } from '@angular/core';
import { AUTH_SESSION } from '@tankos/authn';
import { FEEDBACK_SERVICE } from '@tankos/feedback';
import { LOGGER } from '@tankos/observability-ui';
import { UNIT_DEFINITION_MANAGEMENT_SERVICE } from './units-tokens';
import { unitsAuthorizationGuard } from './units-authorization-guard';
import { UnitDefinitionFeatureService } from './unit-definition-feature-service';
import { UnitDefinitionDetailPageComponent } from './unit-definition-detail-page.component';
import { UnitDefinitionEditorPageComponent } from './unit-definition-editor-page.component';
import { UnitDefinitionListPageComponent } from './unit-definition-list-page.component';

/** Self-contained route tree for mounting the units microfrontend boundary. */
export const unitsRoutes: Route[] = [
  {
    path: '',
    canActivate: [unitsAuthorizationGuard],
    providers: [
      {
        provide: UnitDefinitionFeatureService,
        useFactory: () =>
          new UnitDefinitionFeatureService(
            inject(UNIT_DEFINITION_MANAGEMENT_SERVICE),
            inject(AUTH_SESSION),
            inject(LOGGER),
            inject(FEEDBACK_SERVICE),
          ),
      },
    ],
    children: [
      { path: '', component: UnitDefinitionListPageComponent },
      { path: 'new', component: UnitDefinitionEditorPageComponent },
      { path: ':id/edit', component: UnitDefinitionEditorPageComponent },
      { path: ':id', component: UnitDefinitionDetailPageComponent },
    ],
  },
];
