import {
  ApplicationConfig,
  InjectionToken,
  inject,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  createConsoleLogSink,
  createObservability,
  type Logger,
} from '@tankos/observability';
import { provideTankOsTime } from '@tankos/time';
import { DecimalError } from '@tankos/decimal';
import { DataAccessError } from '@tankos/data-access';
import { UnitError } from '@tankos/units';
import { provideAuthSession } from '@tankos/authn';
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
import { sanitizeObservabilityValue } from '@tankos/observability';
import { FEEDBACK_SERVICE, type FeedbackService } from '@tankos/feedback';
import { provideMaterialFeedback } from '@tankos/feedback-ui';
import { LOGGER } from '@tankos/observability-ui';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { tankosAuthSession } from './firebase';

declare const $localize: (
  messageParts: TemplateStringsArray,
  ...expressions: readonly unknown[]
) => string;

/** App composition token; libraries only receive the neutral Logger contract. */
export const TANKOS_LOGGER = new InjectionToken<Logger>('TANKOS_LOGGER');

/* c8 ignore next -- the production branch is selected by the host environment. */
const tankosObservability = createObservability({
  minimumLogLevel: isDevMode() ? 'debug' : 'warn',
  logSinks: [createConsoleLogSink()],
});

function createTankosErrorReporter(feedback: FeedbackService): ErrorReporter {
  return {
    report: (error) => {
      // Keep the global boundary observable until a production telemetry adapter is configured.
      // eslint-disable-next-line no-console
      console.error('[TankOS error]', sanitizeObservabilityValue(error));
      feedback.error('An unexpected error occurred.');
    },
  };
}

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
    provideMaterialFeedback(),
    provideGlobalErrorHandling(),
    provideErrorNormalizer(dataAccessErrorNormalizer),
    provideErrorNormalizer(validationErrorNormalizer),
    {
      provide: ERROR_REPORTER,
      useFactory: () => createTankosErrorReporter(inject(FEEDBACK_SERVICE)),
    },
    {
      provide: CRUD_UI_LABELS,
      useValue: createCrudUiLabels({
        create: $localize`:@@crud.create:Crear`,
        edit: $localize`:@@crud.edit:Editar`,
        detail: $localize`:@@crud.detail:Ver detalle`,
        delete: $localize`:@@crud.delete:Eliminar`,
        publish: $localize`:@@crud.publish:Hacer pública`,
        physicalDelete: $localize`:@@crud.physicalDelete:Borrar definitivamente`,
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
    { provide: TANKOS_LOGGER, useValue: tankosObservability.logger },
    { provide: LOGGER, useValue: tankosObservability.logger },
    provideRouter(appRoutes),
  ],
};
