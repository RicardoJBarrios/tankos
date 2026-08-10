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
import { SaveParameterTarget } from '../application/save-parameter-target';
import {
  AquariumLocation,
  AquariumTimeZone,
  ParameterTarget,
  ParameterTargets,
} from '../domain/aquarium';
import { ParameterId } from '../domain/measurement';

type WorkspaceStatus = 'loading' | 'ready' | 'no-context' | 'failure';

interface AquariumWorkspaceState {
  readonly status: WorkspaceStatus;
  readonly aquariumName: string | null;
  readonly aquariumTimeZone: AquariumTimeZone | undefined;
  readonly aquariumLocation: AquariumLocation | undefined;
  readonly parameterTargets: ParameterTargets;
}

const initialState: AquariumWorkspaceState = {
  status: 'loading',
  aquariumName: null,
  aquariumTimeZone: undefined,
  aquariumLocation: undefined,
  parameterTargets: {},
};

export const AquariumWorkspaceStore = signalStore(
  withState(initialState),
  withComputed(({ aquariumLocation, aquariumTimeZone }) => ({
    hasLocation: computed(() => aquariumLocation() !== undefined),
    hasTimeZone: computed(() => aquariumTimeZone() !== undefined),
  })),
  withMethods((store) => {
    const readDashboardContext = inject(ReadAquariumDashboardContext);
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
      });

      try {
        const aquarium = await readDashboardContext.execute();
        patchState(store, {
          status: 'ready',
          aquariumName: aquarium.name.value,
          aquariumTimeZone: aquarium.timeZone,
          aquariumLocation: aquarium.location,
          parameterTargets: aquarium.parameterTargets,
        });
      } catch {
        patchState(store, { status: 'failure' });
      }
    }

    function targetFor(parameterId: ParameterId): ParameterTarget | undefined {
      return store.parameterTargets()[parameterId];
    }

    function hasTarget(parameterId: ParameterId): boolean {
      return targetFor(parameterId) !== undefined;
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
      targetFor,
      hasTarget,
      saveTarget,
      removeTarget,
    };
  }),
);
