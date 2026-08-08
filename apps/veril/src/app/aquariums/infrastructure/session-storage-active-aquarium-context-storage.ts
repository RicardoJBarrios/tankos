import { ActiveAquariumContextStorage } from '../application/active-aquarium-context-storage';
import { AquariumId } from '../domain/aquarium';

const storageKey = 'veril.active-aquarium-id';

/** Browser-only, tab-scoped storage for the Active Context restoration hint. */
export class SessionStorageActiveAquariumContextStorage implements ActiveAquariumContextStorage {
  load(): string | null {
    return this.getStorage()?.getItem(storageKey) ?? null;
  }

  save(aquariumId: AquariumId): void {
    this.getStorage()?.setItem(storageKey, aquariumId);
  }

  clear(): void {
    this.getStorage()?.removeItem(storageKey);
  }

  private getStorage(): Storage | undefined {
    return typeof sessionStorage === 'undefined' ? undefined : sessionStorage;
  }
}
