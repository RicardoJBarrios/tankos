import { Injectable } from '@angular/core';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { z } from 'zod';
import {
  AquariumId,
  aquariumIdFrom,
  aquariumTimeZoneFrom,
} from '../../shared/domain/aquarium-reference';
import { CareWork, careWorkIdFrom, createCareWork } from '../domain/care-work';
import {
  createPlannedCareWork,
  createPlannedCareWorkId,
  plannedCareWorkIdFrom,
} from '../domain/planned-care-work';
import { PlannedCareWork } from '../domain/planned-care-work';
import {
  RecurringCarePlan,
  RecurringCarePlanId,
  createRecurringCarePlan,
  nextWeeklyOccurrence,
  recurringCarePlanIdFrom,
} from '../domain/recurring-care-plan';
import {
  PlanCareWorkInput,
  CompletePlannedCareWorkInput,
  CancelPlannedCareWorkInput,
  PlannedCareWorkCompleter,
  PlannedCareWorkCanceller,
  PlannedCareWorkListItem,
  PlannedCareWorkReader,
  PlannedCareWorkWriter,
  RecurringCarePlanStopper,
  RecurringCarePlanWriter,
  EstablishWeeklyRecurringCareInput,
} from '../application/ports';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';
import { careWorkDocument } from './firestore-care-work-repository';
import { systemClock } from '../../shared/application/clock';
import { pageSizeFor } from '../../shared/application/pagination';

const aquariumOwnershipDocument = z
  .object({
    ownerId: z.string().min(1),
    timeZone: z.string().optional(),
  })
  .passthrough();

const plannedCareWorkDocument = z
  .object({
    aquariumId: z.string().min(1),
    ownerId: z.string().min(1),
    description: z.string().min(1),
    plannedFor: z.instanceof(Timestamp),
    recordedAt: z.instanceof(Timestamp),
    provenance: z.enum(['manual', 'recurring-plan']),
    recurringCarePlanId: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.provenance === 'manual' && value.recurringCarePlanId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Manual plan cannot have recurrence origin',
      });
    }
    if (value.provenance === 'recurring-plan' && !value.recurringCarePlanId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Recurring plan requires recurrence origin',
      });
    }
  });

const recurringCarePlanDocument = z.object({
  aquariumId: z.string().min(1),
  ownerId: z.string().min(1),
  description: z.string().min(1),
  firstOccurrenceAt: z.instanceof(Timestamp),
  recordedAt: z.instanceof(Timestamp),
  outstandingPlannedCareWorkId: z.string().min(1),
});

@Injectable()
export class FirestorePlannedCareWorkRepository
  implements
    PlannedCareWorkWriter,
    PlannedCareWorkReader,
    PlannedCareWorkCompleter,
    PlannedCareWorkCanceller,
    RecurringCarePlanWriter,
    RecurringCarePlanStopper
{
  async recordPlanned(input: PlanCareWorkInput): Promise<PlannedCareWork> {
    const { firestore } = getFirebaseClient();
    const reference = doc(firestore, 'plannedCareWorks', input.id);
    const dto = plannedCareWorkDocument.parse({
      aquariumId: input.aquariumId,
      ownerId: input.ownerKeeperId,
      description: input.description,
      plannedFor: Timestamp.fromDate(input.plannedFor),
      recordedAt: Timestamp.fromDate(input.recordedAt),
      provenance: input.provenance,
    });

    await setDoc(reference, dto);

    return createPlannedCareWork({
      id: plannedCareWorkIdFrom(reference.id),
      aquariumId: aquariumIdFrom(dto.aquariumId),
      description: dto.description,
      plannedFor: dto.plannedFor.toDate(),
      recordedAt: dto.recordedAt.toDate(),
      provenance: dto.provenance,
      ...(dto.recurringCarePlanId
        ? {
            recurringCarePlanId: recurringCarePlanIdFrom(
              dto.recurringCarePlanId,
            ),
          }
        : {}),
    });
  }

  async establish(
    input: EstablishWeeklyRecurringCareInput,
  ): Promise<RecurringCarePlan> {
    const { firestore } = getFirebaseClient();
    const aquariumReference = doc(firestore, 'aquariums', input.aquariumId);
    const planReference = doc(firestore, 'recurringCarePlans', input.id);
    const occurrenceReference = doc(
      firestore,
      'plannedCareWorks',
      input.occurrenceId,
    );

    const plan = createRecurringCarePlan({
      id: input.id,
      aquariumId: input.aquariumId,
      description: input.description,
      firstOccurrenceAt: input.firstOccurrenceAt,
      recordedAt: input.recordedAt,
      outstandingPlannedCareWorkId: input.occurrenceId,
      timeZone: input.timeZone,
    });

    await runTransaction(firestore, async (transaction) => {
      const aquariumSnapshot = await transaction.get(aquariumReference);
      const planSnapshot = await transaction.get(planReference);
      const occurrenceSnapshot = await transaction.get(occurrenceReference);
      if (!aquariumSnapshot.exists()) throw new Error('Aquarium not found');
      if (planSnapshot.exists() || occurrenceSnapshot.exists()) {
        throw new Error('Recurring Care already exists');
      }
      const aquarium = aquariumOwnershipDocument.parse(aquariumSnapshot.data());
      if (aquarium.ownerId !== input.ownerKeeperId) {
        throw new Error('Aquarium is not owned by the keeper');
      }
      if (
        aquarium.timeZone &&
        aquariumTimeZoneFrom(aquarium.timeZone) !== input.timeZone
      ) {
        throw new Error('Aquarium time zone does not match the recurring plan');
      }

      const planDto = recurringCarePlanDocument.parse({
        aquariumId: input.aquariumId,
        ownerId: input.ownerKeeperId,
        description: plan.description,
        firstOccurrenceAt: Timestamp.fromDate(plan.firstOccurrenceAt),
        recordedAt: Timestamp.fromDate(plan.recordedAt),
        outstandingPlannedCareWorkId: input.occurrenceId,
      });
      const occurrenceDto = plannedCareWorkDocument.parse({
        aquariumId: input.aquariumId,
        ownerId: input.ownerKeeperId,
        description: plan.description,
        plannedFor: Timestamp.fromDate(plan.firstOccurrenceAt),
        recordedAt: Timestamp.fromDate(plan.recordedAt),
        provenance: 'recurring-plan',
        recurringCarePlanId: input.id,
      });

      if (!aquarium.timeZone) {
        transaction.update(aquariumReference, { timeZone: input.timeZone });
      }
      transaction.set(planReference, planDto);
      transaction.set(occurrenceReference, occurrenceDto);
    });

    return plan;
  }

  async listOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    limitCount: number,
  ): Promise<readonly PlannedCareWorkListItem[]> {
    const { firestore } = getFirebaseClient();
    const plannedCareWorks = collection(firestore, 'plannedCareWorks');
    const plannedQuery = query(
      plannedCareWorks,
      where('ownerId', '==', ownerKeeperId),
      where('aquariumId', '==', aquariumId),
      orderBy('plannedFor', 'asc'),
      orderBy('recordedAt', 'asc'),
      orderBy(documentId(), 'asc'),
      limit(pageSizeFor({ pageSize: limitCount })),
    );
    const snapshot = await getDocs(plannedQuery);

    return snapshot.docs.map((entry) => {
      const dto = plannedCareWorkDocument.parse(entry.data());
      return {
        id: plannedCareWorkIdFrom(entry.id),
        description: dto.description,
        plannedFor: dto.plannedFor.toDate(),
        recordedAt: dto.recordedAt.toDate(),
        provenance: dto.provenance,
        ...(dto.recurringCarePlanId
          ? {
              recurringCarePlanId: recurringCarePlanIdFrom(
                dto.recurringCarePlanId,
              ),
            }
          : {}),
      };
    });
  }

  async complete(input: CompletePlannedCareWorkInput): Promise<CareWork> {
    const { firestore } = getFirebaseClient();
    const plannedReference = doc(firestore, 'plannedCareWorks', input.id);
    const careWorkReference = doc(firestore, 'careWorks', input.id);

    const plannedSnapshot = await getDoc(plannedReference);
    if (!plannedSnapshot.exists()) {
      throw new Error('Planned Care Work not found');
    }

    const plannedDto = plannedCareWorkDocument.parse(plannedSnapshot.data());
    if (
      plannedDto.ownerId !== input.ownerKeeperId ||
      plannedDto.aquariumId !== input.aquariumId
    ) {
      throw new Error('Planned Care Work is not owned by the keeper');
    }

    if (plannedDto.provenance === 'recurring-plan') {
      return this.completeRecurring(input, plannedDto);
    }

    const careWorkDto = careWorkDocument.parse({
      aquariumId: plannedDto.aquariumId,
      ownerId: plannedDto.ownerId,
      description: plannedDto.description,
      performedAt: Timestamp.fromDate(input.completedAt),
      recordedAt: Timestamp.fromDate(input.completedAt),
      provenance: 'manual',
    });

    const batch = writeBatch(firestore);
    batch.set(careWorkReference, careWorkDto);
    batch.delete(plannedReference);
    await batch.commit();

    return createCareWork({
      id: careWorkIdFrom(careWorkReference.id),
      aquariumId: aquariumIdFrom(careWorkDto.aquariumId),
      description: careWorkDto.description,
      performedAt: careWorkDto.performedAt.toDate(),
      recordedAt: careWorkDto.recordedAt.toDate(),
      provenance: careWorkDto.provenance,
    });
  }

  async cancel(input: CancelPlannedCareWorkInput): Promise<void> {
    const { firestore } = getFirebaseClient();
    const plannedReference = doc(firestore, 'plannedCareWorks', input.id);
    const plannedSnapshot = await getDoc(plannedReference);

    if (!plannedSnapshot.exists()) {
      throw new Error('Planned Care Work not found');
    }

    const plannedDto = plannedCareWorkDocument.parse(plannedSnapshot.data());
    if (
      plannedDto.ownerId !== input.ownerKeeperId ||
      plannedDto.aquariumId !== input.aquariumId
    ) {
      throw new Error('Planned Care Work is not owned by the keeper');
    }

    if (plannedDto.provenance === 'recurring-plan') {
      await this.cancelRecurring(input, plannedDto);
      return;
    }

    await deleteDoc(plannedReference);
  }

  async stop(input: {
    readonly id: RecurringCarePlanId;
    readonly aquariumId: AquariumId;
    readonly ownerKeeperId: string;
  }): Promise<void> {
    const { firestore } = getFirebaseClient();
    const planReference = doc(firestore, 'recurringCarePlans', input.id);

    await runTransaction(firestore, async (transaction) => {
      const planSnapshot = await transaction.get(planReference);
      if (!planSnapshot.exists()) throw new Error('Recurring Care not found');
      const planDto = recurringCarePlanDocument.parse(planSnapshot.data());
      if (
        planDto.ownerId !== input.ownerKeeperId ||
        planDto.aquariumId !== input.aquariumId
      ) {
        throw new Error('Recurring Care is not owned by the keeper');
      }

      const occurrenceReference = doc(
        firestore,
        'plannedCareWorks',
        planDto.outstandingPlannedCareWorkId,
      );
      const occurrenceSnapshot = await transaction.get(occurrenceReference);
      if (!occurrenceSnapshot.exists()) {
        throw new Error('Recurring Care occurrence not found');
      }
      const occurrenceDto = plannedCareWorkDocument.parse(
        occurrenceSnapshot.data(),
      );
      if (
        occurrenceDto.recurringCarePlanId !== input.id ||
        occurrenceDto.ownerId !== input.ownerKeeperId ||
        occurrenceDto.aquariumId !== input.aquariumId
      ) {
        throw new Error('Recurring Care occurrence is not valid');
      }

      transaction.delete(occurrenceReference);
      transaction.delete(planReference);
    });
  }

  private async completeRecurring(
    input: CompletePlannedCareWorkInput,
    plannedDto: z.infer<typeof plannedCareWorkDocument>,
  ): Promise<CareWork> {
    const { firestore } = getFirebaseClient();
    const plannedReference = doc(firestore, 'plannedCareWorks', input.id);
    if (!plannedDto.recurringCarePlanId) {
      throw new Error('Recurring Care occurrence has no plan origin');
    }
    const planId = recurringCarePlanIdFrom(plannedDto.recurringCarePlanId);
    const planReference = doc(firestore, 'recurringCarePlans', planId);
    const aquariumReference = doc(firestore, 'aquariums', input.aquariumId);
    const careWorkReference = doc(firestore, 'careWorks', input.id);
    const nextOccurrenceId = createPlannedCareWorkId();
    const nextOccurrenceReference = doc(
      firestore,
      'plannedCareWorks',
      nextOccurrenceId,
    );

    let result: CareWork | undefined;
    await runTransaction(firestore, async (transaction) => {
      const plannedSnapshot = await transaction.get(plannedReference);
      const planSnapshot = await transaction.get(planReference);
      const aquariumSnapshot = await transaction.get(aquariumReference);
      if (
        !plannedSnapshot.exists() ||
        !planSnapshot.exists() ||
        !aquariumSnapshot.exists()
      ) {
        throw new Error('Recurring Care occurrence is no longer available');
      }
      const current = plannedCareWorkDocument.parse(plannedSnapshot.data());
      const plan = recurringCarePlanDocument.parse(planSnapshot.data());
      const aquarium = aquariumOwnershipDocument.parse(aquariumSnapshot.data());
      if (
        current.recurringCarePlanId !== planId ||
        plan.outstandingPlannedCareWorkId !== input.id ||
        plan.ownerId !== input.ownerKeeperId ||
        plan.aquariumId !== input.aquariumId ||
        aquarium.ownerId !== input.ownerKeeperId ||
        !aquarium.timeZone
      ) {
        throw new Error('Recurring Care occurrence is stale or invalid');
      }

      const nextOccurrence = nextWeeklyOccurrence(
        current.plannedFor.toDate(),
        input.completedAt,
        aquariumTimeZoneFrom(aquarium.timeZone),
      );
      const careWorkDto = careWorkDocument.parse({
        aquariumId: current.aquariumId,
        ownerId: current.ownerId,
        description: current.description,
        performedAt: Timestamp.fromDate(input.completedAt),
        recordedAt: Timestamp.fromDate(input.completedAt),
        provenance: 'manual',
      });
      const nextDto = plannedCareWorkDocument.parse({
        aquariumId: current.aquariumId,
        ownerId: current.ownerId,
        description: current.description,
        plannedFor: Timestamp.fromDate(nextOccurrence),
        recordedAt: Timestamp.fromDate(input.completedAt),
        provenance: 'recurring-plan',
        recurringCarePlanId: planId,
      });

      transaction.set(careWorkReference, careWorkDto);
      transaction.delete(plannedReference);
      transaction.set(nextOccurrenceReference, nextDto);
      transaction.update(planReference, {
        outstandingPlannedCareWorkId: nextOccurrenceId,
      });
      result = createCareWork({
        id: careWorkIdFrom(careWorkReference.id),
        aquariumId: aquariumIdFrom(careWorkDto.aquariumId),
        description: careWorkDto.description,
        performedAt: careWorkDto.performedAt.toDate(),
        recordedAt: careWorkDto.recordedAt.toDate(),
        provenance: careWorkDto.provenance,
      });
    });

    if (!result)
      throw new Error('Recurring Care completion produced no result');
    return result;
  }

  private async cancelRecurring(
    input: CancelPlannedCareWorkInput,
    plannedDto: z.infer<typeof plannedCareWorkDocument>,
  ): Promise<void> {
    const { firestore } = getFirebaseClient();
    const plannedReference = doc(firestore, 'plannedCareWorks', input.id);
    if (!plannedDto.recurringCarePlanId) {
      throw new Error('Recurring Care occurrence has no plan origin');
    }
    const planId = recurringCarePlanIdFrom(plannedDto.recurringCarePlanId);
    const planReference = doc(firestore, 'recurringCarePlans', planId);
    const aquariumReference = doc(firestore, 'aquariums', input.aquariumId);
    const nextOccurrenceId = createPlannedCareWorkId();
    const nextOccurrenceReference = doc(
      firestore,
      'plannedCareWorks',
      nextOccurrenceId,
    );

    await runTransaction(firestore, async (transaction) => {
      const plannedSnapshot = await transaction.get(plannedReference);
      const planSnapshot = await transaction.get(planReference);
      const aquariumSnapshot = await transaction.get(aquariumReference);
      if (
        !plannedSnapshot.exists() ||
        !planSnapshot.exists() ||
        !aquariumSnapshot.exists()
      ) {
        throw new Error('Recurring Care occurrence is no longer available');
      }
      const current = plannedCareWorkDocument.parse(plannedSnapshot.data());
      const plan = recurringCarePlanDocument.parse(planSnapshot.data());
      const aquarium = aquariumOwnershipDocument.parse(aquariumSnapshot.data());
      if (
        current.recurringCarePlanId !== planId ||
        plan.outstandingPlannedCareWorkId !== input.id ||
        plan.ownerId !== input.ownerKeeperId ||
        plan.aquariumId !== input.aquariumId ||
        aquarium.ownerId !== input.ownerKeeperId ||
        !aquarium.timeZone
      ) {
        throw new Error('Recurring Care occurrence is stale or invalid');
      }

      const actionAt = input.actionAt ?? systemClock.now();
      const nextOccurrence = nextWeeklyOccurrence(
        current.plannedFor.toDate(),
        actionAt,
        aquariumTimeZoneFrom(aquarium.timeZone),
      );
      const nextDto = plannedCareWorkDocument.parse({
        aquariumId: current.aquariumId,
        ownerId: current.ownerId,
        description: current.description,
        plannedFor: Timestamp.fromDate(nextOccurrence),
        recordedAt: Timestamp.fromDate(actionAt),
        provenance: 'recurring-plan',
        recurringCarePlanId: planId,
      });

      transaction.delete(plannedReference);
      transaction.set(nextOccurrenceReference, nextDto);
      transaction.update(planReference, {
        outstandingPlannedCareWorkId: nextOccurrenceId,
      });
    });
  }
}
