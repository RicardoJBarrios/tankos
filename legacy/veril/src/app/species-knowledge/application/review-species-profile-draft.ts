import { SpeciesProfileId } from '../domain/species-profile';
import { SpeciesProfileReviewer } from './ports';

export class ReviewSpeciesProfileDraft {
  constructor(private readonly reviewer: SpeciesProfileReviewer) {}

  execute(id: SpeciesProfileId): Promise<void> {
    return this.reviewer.reviewDraft(id);
  }
}
