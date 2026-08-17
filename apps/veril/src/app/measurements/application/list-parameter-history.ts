import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import {
  KeeperSession,
  ParameterHistoryPage,
  ParameterHistoryCursor,
  ParameterHistoryFilter,
  ParameterHistoryReader,
} from './ports';

export class ListParameterHistory {
  constructor(
    private readonly reader: ParameterHistoryReader,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(
    filter: ParameterHistoryFilter,
    cursor?: ParameterHistoryCursor,
    pageSize?: number,
  ): Promise<ParameterHistoryPage> {
    if (filter.from && Number.isNaN(filter.from.getTime())) {
      throw new Error('Parameter History start must be a valid date');
    }
    if (filter.to && Number.isNaN(filter.to.getTime())) {
      throw new Error('Parameter History end must be a valid date');
    }
    if (filter.from && filter.to && filter.from >= filter.to) {
      throw new Error('Parameter History interval is invalid');
    }

    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();
    if (!aquariumId) throw new Error('Aquarium context is required');

    return pageSize === undefined
      ? this.reader.listOwnedHistory(keeper.id, aquariumId, filter, cursor)
      : this.reader.listOwnedHistory(
          keeper.id,
          aquariumId,
          filter,
          cursor,
          pageSize,
        );
  }
}
