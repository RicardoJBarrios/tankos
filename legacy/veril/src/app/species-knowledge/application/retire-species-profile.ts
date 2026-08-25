import { SpeciesProfileId } from '../domain/species-profile';
import { SpeciesProfileRetirer } from './ports';

export class RetireSpeciesProfile {
  constructor(private readonly retirer: SpeciesProfileRetirer) {}

  execute(id: SpeciesProfileId): Promise<void> {
    return this.retirer.retireProfile(id);
  }
}
