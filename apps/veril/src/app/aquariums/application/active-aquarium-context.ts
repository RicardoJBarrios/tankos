import { AquariumId } from '../domain/aquarium';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';

export class ActiveAquariumContext {
  private activeAquariumId: AquariumId | null = null;

  constructor(private readonly storage: ActiveAquariumContextStorage) {}

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
