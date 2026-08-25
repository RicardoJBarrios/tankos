import {
  AquariumCursor,
  AquariumPage,
  AquariumReader,
  KeeperSession,
} from './ports';

export class ListMyAquariums {
  constructor(
    private readonly reader: AquariumReader,
    private readonly keeperSession: KeeperSession,
  ) {}

  async execute(
    cursor?: AquariumCursor,
    pageSize?: number,
  ): Promise<AquariumPage> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();

    return pageSize === undefined
      ? this.reader.listOwned(keeper.id, cursor)
      : this.reader.listOwned(keeper.id, cursor, pageSize);
  }
}
