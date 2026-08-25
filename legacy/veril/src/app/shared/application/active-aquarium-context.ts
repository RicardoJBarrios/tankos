import { aquariumIdFrom, AquariumId } from '../domain/aquarium-reference';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';

export class ActiveAquariumContext {
  private activeAquariumId: AquariumId | null;

  constructor(private readonly storage: ActiveAquariumContextStorage) {
    const storedId = storage.load();

    try {
      this.activeAquariumId = storedId ? aquariumIdFrom(storedId) : null;
    } catch {
      this.activeAquariumId = null;
    }
  }

  get(): AquariumId | null {
    return this.activeAquariumId;
  }

  select(aquariumId: AquariumId): void {
    if (this.activeAquariumId === aquariumId) {
      return;
    }

    this.activeAquariumId = aquariumId;
    this.storage.save(aquariumId);
  }

  clear(): void {
    this.activeAquariumId = null;
    this.storage.clear();
  }
}
