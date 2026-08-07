import { AquariumId } from '../domain/aquarium-id';

export class ActiveAquariumContext {
  private activeAquariumId: AquariumId | null = null;

  get(): AquariumId | null {
    return this.activeAquariumId;
  }

  select(aquariumId: AquariumId): void {
    if (this.activeAquariumId === aquariumId) {
      return;
    }

    this.activeAquariumId = aquariumId;
  }

  clear(): void {
    this.activeAquariumId = null;
  }
}
