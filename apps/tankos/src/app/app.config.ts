import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideTankOsTime, TIME_CLOCK } from '@tankos/time';
import { DecimalError } from '@tankos/decimal';
import { DataAccessError } from '@tankos/data-access';
import { UnitError } from '@tankos/units';
import { AUTH_SESSION, provideAuthSession } from '@tankos/auth';
import { createUnitDefinitionManagementService } from '@tankos/units';
import { createDefaultUnitDefinitionFirestoreRepository } from '@tankos/units-firestore';
import { CRUD_UI_LABELS, createCrudUiLabels } from '@tankos/data-access-ui';
import {
  ERROR_REPORTER,
  createAppError,
  provideErrorNormalizer,
  provideGlobalErrorHandling,
  type ErrorCode,
  type ErrorNormalizer,
  type ErrorReporter,
} from '@tankos/error-handling';
import {
  UNIT_DEFINITION_MANAGEMENT_SERVICE,
  UnitDefinitionFeatureService,
} from '@tankos/units-ui';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { tankosAuthSession, tankosFirestore } from './firebase';

declare const $localize: (
  messageParts: TemplateStringsArray,
  ...expressions: readonly unknown[]
) => string;

const tankosErrorReporter: ErrorReporter = {
  report: (error) => {
    // Keep the global boundary observable until a production telemetry adapter is configured.
    // eslint-disable-next-line no-console
    console.error('[TankOS error]', error);
  },
};

const dataAccessErrorNormalizer: ErrorNormalizer = {
  supports: (error) => error instanceof DataAccessError,
  normalize: (error) => {
    const dataAccessError = error as DataAccessError;
    const code = mapDataAccessErrorCode(dataAccessError.code);
    return createAppError(code, {
      severity: code === 'conflict' ? 'warning' : 'error',
      retryable: dataAccessError.retryable,
      cause: error,
      context: { source: 'DataAccessError' },
    });
  },
};

function mapDataAccessErrorCode(code: DataAccessError['code']): ErrorCode {
  switch (code) {
    case 'forbidden':
      return 'permission-denied';
    case 'transient':
      return 'network';
    case 'permanent':
      return 'persistence';
    case 'lifecycle':
      return 'conflict';
    case 'not-found':
      return 'not-found';
    case 'validation':
      return 'validation';
    case 'conflict':
      return 'conflict';
  }
}

const validationErrorNormalizer: ErrorNormalizer = {
  supports: (error) =>
    error instanceof UnitError || error instanceof DecimalError,
  normalize: (error) =>
    createAppError('validation', {
      severity: 'warning',
      retryable: false,
      cause: error,
      context: {
        source: error instanceof UnitError ? 'UnitError' : 'DecimalError',
      },
    }),
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideGlobalErrorHandling(),
    provideErrorNormalizer(dataAccessErrorNormalizer),
    provideErrorNormalizer(validationErrorNormalizer),
    { provide: ERROR_REPORTER, useValue: tankosErrorReporter },
    {
      provide: CRUD_UI_LABELS,
      useValue: createCrudUiLabels({
        create: $localize`:@@crud.create:Crear`,
        edit: $localize`:@@crud.edit:Editar`,
        delete: $localize`:@@crud.delete:Eliminar`,
        restore: $localize`:@@crud.restore:Restaurar`,
        loading: $localize`:@@crud.loading:Cargando`,
        error: $localize`:@@crud.error:No se pudieron cargar los registros`,
        empty: $localize`:@@crud.empty:No hay registros`,
        select: $localize`:@@crud.select:Seleccionar`,
        actions: $localize`:@@crud.actions:Acciones`,
        loadMore: $localize`:@@crud.loadMore:Cargar más`,
        deleteSelected: $localize`:@@crud.deleteSelected:Eliminar seleccionados`,
      }),
    },
    provideTankOsTime(),
    provideAuthSession(tankosAuthSession),
    {
      provide: UNIT_DEFINITION_MANAGEMENT_SERVICE,
      useFactory: () =>
        createUnitDefinitionManagementService(
          createDefaultUnitDefinitionFirestoreRepository({
            firestore: tankosFirestore,
            clock: inject(TIME_CLOCK),
          }),
        ),
    },
    {
      provide: UnitDefinitionFeatureService,
      useFactory: () =>
        new UnitDefinitionFeatureService(
          inject(UNIT_DEFINITION_MANAGEMENT_SERVICE),
          inject(AUTH_SESSION),
        ),
    },
    provideRouter(appRoutes),
  ],
};
