import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../application/active-aquarium-context-storage';
import { ListMyAquariums } from '../application/list-my-aquariums';
import { AquariumListItem } from '../application/aquarium-ports';
import { aquariumIdFrom, AquariumName } from '../domain/aquarium';
import { AquariumWorkspaceStore } from './aquarium-workspace-store';

const activeId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const aquarium: AquariumListItem = {
  id: activeId,
  name: AquariumName.create('Veril'),
};

describe('AquariumWorkspaceStore', () => {
  const execute = vi.fn();
  let selected = true;

  beforeEach(() => {
    execute.mockReset();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AquariumWorkspaceStore,
        { provide: ListMyAquariums, useValue: { execute } },
        {
          provide: ActiveAquariumContext,
          useFactory: () => {
            const storage: ActiveAquariumContextStorage = {
              load: vi.fn(),
              save: vi.fn(),
              clear: vi.fn(),
            };
            const context = new ActiveAquariumContext(storage);
            if (selected) context.select(activeId);
            return context;
          },
        },
      ],
    });
  });

  it('loads the selected Aquarium into scoped state', async () => {
    execute.mockResolvedValue([aquarium]);
    const store = TestBed.inject(AquariumWorkspaceStore);

    await store.load();

    expect(store.status()).toBe('ready');
    expect(store.aquariumName()).toBe('Veril');
    expect(store.hasLocation()).toBe(false);
    expect(store.hasTimeZone()).toBe(false);
  });

  it('does not query without an Active Context', async () => {
    selected = false;
    const store = TestBed.inject(AquariumWorkspaceStore);

    await store.load();

    expect(store.status()).toBe('no-context');
    expect(execute).not.toHaveBeenCalled();
    selected = true;
  });

  it('resets the scoped state when the selected Aquarium changes', async () => {
    execute.mockResolvedValue([aquarium]);
    const store = TestBed.inject(AquariumWorkspaceStore);
    await store.load();

    execute.mockResolvedValue([]);
    await store.reload();

    expect(store.status()).toBe('failure');
    expect(store.aquariumName()).toBeNull();
  });
});
