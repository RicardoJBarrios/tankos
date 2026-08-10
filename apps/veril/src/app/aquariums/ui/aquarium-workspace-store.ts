import { computed, inject } from '@angular/core';
import {
  signalStore,
  withComputed,
  withMethods,
  withState,
  patchState,
} from '@ngrx/signals';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { ReadAquariumDashboardContext } from '../application/read-aquarium-dashboard-context';
import { RemoveParameterTarget } from '../application/remove-parameter-target';
import { ReviewCurrentMeasurements } from '../application/review-current-measurements';
import { SaveParameterTarget } from '../application/save-parameter-target';
import {
  CurrentParameterState,
  currentParameterStateFor,
} from '../application/parameter-status';
import {
  AquariumLocation,
  AquariumTimeZone,
  ParameterTarget,
  ParameterTargets,
} from '../domain/aquarium';
import { PARAMETER_IDS, ParameterId } from '../domain/measurement';
import { CurrentMeasurementValue } from '../application/aquarium-ports';

type WorkspaceStatus = 'loading' | 'ready' | 'no-context' | 'failure';

interface AquariumWorkspaceState {
  readonly status: WorkspaceStatus;
  readonly aquariumName: string | null;
  readonly aquariumTimeZone: AquariumTimeZone | undefined;
  readonly aquariumLocation: AquariumLocation | undefined;
  readonly parameterTargets: ParameterTargets;
  readonly currentMeasurements: readonly CurrentMeasurementValue[];
  readonly currentMeasurementsLoading: boolean;
  readonly currentMeasurementsError: boolean;
}

const initialState: AquariumWorkspaceState = {
  status: 'loading',
  aquariumName: null,
  aquariumTimeZone: undefined,
  aquariumLocation: undefined,
  parameterTargets: {},
  currentMeasurements: [],
  currentMeasurementsLoading: false,
  currentMeasurementsError: false,
};

export const AquariumWorkspaceStore = signalStore(
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
    const saveParameterTarget = inject(SaveParameterTarget);
    const removeParameterTarget = inject(RemoveParameterTarget);
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

    function targetFor(parameterId: ParameterId): ParameterTarget | undefined {
      return store.parameterTargets()[parameterId];
    }

    function hasTarget(parameterId: ParameterId): boolean {
      return targetFor(parameterId) !== undefined;
    }

    function currentParameterStateFor(
      parameterId: ParameterId,
    ): CurrentParameterState {
      const state = store
        .currentParameterStates()
        .find((item) => item.parameterId === parameterId);

      if (!state) {
        throw new Error('Unsupported Parameter');
      }

      return state;
    }

    async function saveTarget(
      parameterId: ParameterId,
      minimum: number,
      maximum: number,
    ): Promise<ParameterTarget> {
      const target = await saveParameterTarget.execute(
        parameterId,
        minimum,
        maximum,
      );
      patchState(store, {
        parameterTargets: {
          ...store.parameterTargets(),
          [parameterId]: target,
        },
      });
      return target;
    }

    async function removeTarget(parameterId: ParameterId): Promise<void> {
      await removeParameterTarget.execute(parameterId);
      const parameterTargets = { ...store.parameterTargets() };
      delete parameterTargets[parameterId];
      patchState(store, { parameterTargets });
    }

    return {
      load,
      reload: load,
      loadCurrentMeasurements,
      targetFor,
      hasTarget,
      currentParameterStateFor,
      saveTarget,
      removeTarget,
    };
  }),
);
