import type { WritableSignal } from '@angular/core';
import type { AuthSessionPort } from '@tankos/authn';
import type { FeedbackService } from '@tankos/feedback';
import type { Logger } from '@tankos/observability';
import type { CrudListStoreInstance } from '@tankos/data-access-ui';
import type { UnitDefinition, UnitDefinitionRecord } from '@tankos/units';
import type { FeatureOperationStatus } from './unit-definition-feature-store';

export function runUnitDefinitionLifecycle(
  list: Pick<
    CrudListStoreInstance<UnitDefinition, unknown, unknown>,
    'markForDeletion' | 'restore'
  >,
  authSession: AuthSessionPort,
  record: UnitDefinitionRecord,
  operation: 'delete' | 'restore',
  lifecycleError: WritableSignal<unknown>,
  lifecycleStatus: WritableSignal<FeatureOperationStatus>,
  logger: Logger,
  feedback: FeedbackService,
): Promise<void> {
  logger.debug('Unit definition lifecycle operation started', {
    operation,
    id: record.id,
  });
  lifecycleError.set(undefined);
  lifecycleStatus.set('pending');
  return executeLifecycle(
    list,
    authSession,
    record,
    operation,
    lifecycleError,
    lifecycleStatus,
    logger,
    feedback,
  );
}

async function executeLifecycle(
  list: Pick<
    CrudListStoreInstance<UnitDefinition, unknown, unknown>,
    'markForDeletion' | 'restore'
  >,
  authSession: AuthSessionPort,
  record: UnitDefinitionRecord,
  operation: 'delete' | 'restore',
  lifecycleError: WritableSignal<unknown>,
  lifecycleStatus: WritableSignal<FeatureOperationStatus>,
  logger: Logger,
  feedback: FeedbackService,
): Promise<void> {
  try {
    const access = await authSession.access();
    const request = {
      access,
      id: record.id,
      expectedRevision: record.revision,
    };
    const result =
      operation === 'delete'
        ? await list.markForDeletion(request)
        : await list.restore(request);
    if (!result.ok) throw result.error;
    lifecycleStatus.set('idle');
    feedback.success(
      operation === 'delete'
        ? 'Unit moved to the recycle bin.'
        : 'Unit restored successfully.',
    );
    logger.debug('Unit definition lifecycle operation completed', {
      operation,
      id: record.id,
    });
  } catch (error) {
    logger.debug('Unit definition lifecycle operation failed', {
      operation,
      id: record.id,
      error,
    });
    lifecycleStatus.set('error');
    lifecycleError.set(error);
    feedback.error(
      operation === 'delete'
        ? 'Unable to delete the unit.'
        : 'Unable to restore the unit.',
    );
  }
}
