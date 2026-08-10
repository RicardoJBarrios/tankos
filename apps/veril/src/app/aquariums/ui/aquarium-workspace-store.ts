import { computed, inject } from '@angular/core';
import {
  signalStore,
  withComputed,
  withMethods,
  withState,
  patchState,
} from '@ngrx/signals';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { ListMyAquariums } from '../application/list-my-aquariums';
import { AquariumLocation, AquariumTimeZone } from '../domain/aquarium';

type WorkspaceStatus = 'loading' | 'ready' | 'no-context' | 'failure';

interface AquariumWorkspaceState {
  readonly status: WorkspaceStatus;
  readonly aquariumName: string | null;
  readonly aquariumTimeZone: AquariumTimeZone | undefined;
  readonly aquariumLocation: AquariumLocation | undefined;
}

const initialState: AquariumWorkspaceState = {
  status: 'loading',
  aquariumName: null,
  aquariumTimeZone: undefined,
  aquariumLocation: undefined,
};

export const AquariumWorkspaceStore = signalStore(
  withState(initialState),
  withComputed(({ aquariumLocation, aquariumTimeZone }) => ({
    hasLocation: computed(() => aquariumLocation() !== undefined),
    hasTimeZone: computed(() => aquariumTimeZone() !== undefined),
  })),
  withMethods((store) => {
    const listMyAquariums = inject(ListMyAquariums);
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
        const aquarium = (await listMyAquariums.execute()).find(
          ({ id }) => id === aquariumId,
        );
        if (!aquarium) {
          patchState(store, { status: 'failure' });
          return;
        }

        patchState(store, {
          status: 'ready',
          aquariumName: aquarium.name.value,
          aquariumTimeZone: aquarium.timeZone,
          aquariumLocation: aquarium.location,
        });
      } catch {
        patchState(store, { status: 'failure' });
      }
    }

    return {
      load,
      reload: load,
    };
  }),
);
