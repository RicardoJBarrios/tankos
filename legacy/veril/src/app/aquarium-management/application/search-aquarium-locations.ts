import { LocationCandidate, LocationSearch } from './ports';

export class SearchAquariumLocations {
  constructor(private readonly searcher: LocationSearch) {}

  async execute(query: string): Promise<readonly LocationCandidate[]> {
    const normalized = query.trim();
    if (normalized.length < 3) {
      return [];
    }

    return this.searcher.search(normalized);
  }
}
