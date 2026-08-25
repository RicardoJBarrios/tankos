import { computed, inject } from '@angular/core';
import {
  signalStore,
  withComputed,
  withMethods,
  withState,
  patchState,
} from '@ngrx/signals';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ReadAquariumDashboardContext } from '../../aquarium-management/application/read-aquarium-dashboard-context';
import { ReviewCurrentMeasurements } from '../../measurements/application/review-current-measurements';
import {
  CurrentParameterState,
  currentParameterStateFor,
} from '../../measurements/application/parameter-status';
import {
  AquariumLocation,
  AquariumTimeZone,
  ParameterTargets,
} from '../../aquarium-management/domain/aquarium';
import { PARAMETER_IDS } from '../../shared/domain/parameter-reference';
import { CurrentMeasurementValue } from '../../measurements/application/ports';

type DashboardStatus = 'loading' | 'ready' | 'no-context' | 'failure';

interface AquariumDashboardState {
  readonly status: DashboardStatus;
  readonly aquariumName: string | null;
  readonly aquariumTimeZone: AquariumTimeZone | undefined;
  readonly aquariumLocation: AquariumLocation | undefined;
  readonly parameterTargets: ParameterTargets;
  readonly currentMeasurements: readonly CurrentMeasurementValue[];
  readonly currentMeasurementsLoading: boolean;
  readonly currentMeasurementsError: boolean;
}

const initialState: AquariumDashboardState = {
  status: 'loading',
  aquariumName: null,
  aquariumTimeZone: undefined,
  aquariumLocation: undefined,
  parameterTargets: {},
  currentMeasurements: [],
  currentMeasurementsLoading: false,
  currentMeasurementsError: false,
};

export const AquariumDashboardStore = signalStore(
  withState(initialState),
  withComputed(
    ({
      aquariumLocation,
      aquariumTimeZone,
      currentMeasurements,
      parameterTargets,
    }) => ({
      hasLocation: computed(() => aquariumLocation() !== undefined),
      hasTimeZone: computed(() => aquariumTimeZone() !== undefined),
      hasParameterTargets: computed(
        () => Object.keys(parameterTargets()).length > 0,
      ),
      currentParameterStates: computed<readonly CurrentParameterState[]>(() => {
        const measurements = new Map(
          currentMeasurements().map((measurement) => [
            measurement.parameterId,
            measurement,
          ]),
        );

        return PARAMETER_IDS.map((parameterId) =>
          currentParameterStateFor(
            parameterId,
            measurements.get(parameterId) ?? null,
            parameterTargets()[parameterId],
          ),
        );
      }),
    }),
  ),
  withMethods((store) => {
    const readDashboardContext = inject(ReadAquariumDashboardContext);
    const reviewCurrentMeasurements = inject(ReviewCurrentMeasurements);
    const activeContext = inject(ActiveAquariumContext);

    async function load(): Promise<void> {
      const aquariumId = activeContext.get();
      if (!aquariumId) {
        patchState(store, {
          ...initialState,
          status: 'no-context',
        });
        return;
      }

      patchState(store, {
        ...initialState,
        status: 'loading',
        currentMeasurementsLoading: true,
      });

      const [aquariumResult, measurementsResult] = await Promise.allSettled([
        readDashboardContext.execute(),
        reviewCurrentMeasurements.execute(),
      ]);

      if (aquariumResult.status === 'fulfilled') {
        const aquarium = aquariumResult.value;
        patchState(store, {
          status: 'ready',
          aquariumName: aquarium.name.value,
          aquariumTimeZone: aquarium.timeZone,
          aquariumLocation: aquarium.location,
          parameterTargets: aquarium.parameterTargets,
        });
      } else {
        patchState(store, { status: 'failure' });
      }

      if (measurementsResult.status === 'fulfilled') {
        patchState(store, {
          currentMeasurements: measurementsResult.value,
          currentMeasurementsLoading: false,
          currentMeasurementsError: false,
        });
      } else {
        patchState(store, {
          currentMeasurements: [],
          currentMeasurementsLoading: false,
          currentMeasurementsError: true,
        });
      }
    }

    async function loadCurrentMeasurements(): Promise<void> {
      if (!activeContext.get()) {
        patchState(store, {
          currentMeasurements: [],
          currentMeasurementsLoading: false,
          currentMeasurementsError: false,
        });
        return;
      }

      patchState(store, {
        currentMeasurementsLoading: true,
        currentMeasurementsError: false,
      });

      try {
        patchState(store, {
          currentMeasurements: await reviewCurrentMeasurements.execute(),
          currentMeasurementsLoading: false,
          currentMeasurementsError: false,
        });
      } catch {
        patchState(store, {
          currentMeasurements: [],
          currentMeasurementsLoading: false,
          currentMeasurementsError: true,
        });
      }
    }

    return {
      load,
      reload: load,
      loadCurrentMeasurements,
    };
  }),
);
