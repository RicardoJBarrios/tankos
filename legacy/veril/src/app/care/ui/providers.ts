import { InjectionToken } from '@angular/core';
import {
  CareWorkReader,
  CareWorkWriter,
  CareAquariumContextReader,
  PlannedCareWorkCanceller,
  PlannedCareWorkCompleter,
  PlannedCareWorkReader,
  PlannedCareWorkWriter,
  RecurringCarePlanStopper,
  RecurringCarePlanWriter,
} from '../application/ports';
export { KEEPER_SESSION } from '../../shared/ui/providers';

export const CARE_WORK_WRITER = new InjectionToken<CareWorkWriter>(
  'CARE_WORK_WRITER',
);
export const CARE_WORK_READER = new InjectionToken<CareWorkReader>(
  'CARE_WORK_READER',
);
export const PLANNED_CARE_WORK_WRITER =
  new InjectionToken<PlannedCareWorkWriter>('PLANNED_CARE_WORK_WRITER');
export const PLANNED_CARE_WORK_READER =
  new InjectionToken<PlannedCareWorkReader>('PLANNED_CARE_WORK_READER');
export const PLANNED_CARE_WORK_COMPLETER =
  new InjectionToken<PlannedCareWorkCompleter>('PLANNED_CARE_WORK_COMPLETER');
export const PLANNED_CARE_WORK_CANCELLER =
  new InjectionToken<PlannedCareWorkCanceller>('PLANNED_CARE_WORK_CANCELLER');
export const RECURRING_CARE_PLAN_WRITER =
  new InjectionToken<RecurringCarePlanWriter>('RECURRING_CARE_PLAN_WRITER');
export const RECURRING_CARE_PLAN_STOPPER =
  new InjectionToken<RecurringCarePlanStopper>('RECURRING_CARE_PLAN_STOPPER');
export const CARE_AQUARIUM_CONTEXT_READER =
  new InjectionToken<CareAquariumContextReader>('CARE_AQUARIUM_CONTEXT_READER');
