import { AquariumId } from '../domain/aquarium-reference';

/**
 * Stores the untrusted browser hint used to restore the current application
 * context. Ownership is always revalidated before it becomes active.
 */
export interface ActiveAquariumContextStorage {
  load(): string | null;
  save(aquariumId: AquariumId): void;
  clear(): void;
}
