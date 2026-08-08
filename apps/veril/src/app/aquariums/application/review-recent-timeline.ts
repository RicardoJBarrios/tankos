import { ActiveAquariumContext } from './active-aquarium-context';
import {
  KeeperSession,
  CareWorkListItem,
  CareWorkReader,
  MeasurementListItem,
  TimelineMeasurementReader,
  TimelineObservationReader,
  ObservationListItem,
} from './aquarium-ports';

export const RECENT_TIMELINE_LIMIT = 20;

export type ObservationTimelineItem = {
  readonly kind: 'observation';
  readonly observationId: ObservationListItem['id'];
  readonly content: string;
  readonly effectiveAt: Date;
  readonly recordedAt: Date;
};

export type MeasurementTimelineItem = {
  readonly kind: 'measurement';
  readonly measurementId: MeasurementListItem['id'];
  readonly parameterId: MeasurementListItem['parameterId'];
  readonly canonicalValue: number;
  readonly canonicalUnit: MeasurementListItem['canonicalUnit'];
  readonly effectiveAt: Date;
  readonly measuredAt: Date;
  readonly recordedAt: Date;
};

export type CareWorkTimelineItem = {
  readonly kind: 'care-work';
  readonly careWorkId: CareWorkListItem['id'];
  readonly description: string;
  readonly effectiveAt: Date;
  readonly performedAt: Date;
  readonly recordedAt: Date;
};

export type TimelineItem =
  ObservationTimelineItem | MeasurementTimelineItem | CareWorkTimelineItem;

const sourceOrder: Record<TimelineItem['kind'], number> = {
  measurement: 0,
  observation: 1,
  'care-work': 2,
};

function toTimelineItem(
  item: ObservationListItem | MeasurementListItem | CareWorkListItem,
): TimelineItem {
  if ('content' in item) {
    return {
      kind: 'observation',
      observationId: item.id,
      content: item.content,
      effectiveAt: item.recordedAt,
      recordedAt: item.recordedAt,
    };
  }

  if ('description' in item) {
    return {
      kind: 'care-work',
      careWorkId: item.id,
      description: item.description,
      effectiveAt: item.performedAt,
      performedAt: item.performedAt,
      recordedAt: item.recordedAt,
    };
  }

  return {
    kind: 'measurement',
    measurementId: item.id,
    parameterId: item.parameterId,
    canonicalValue: item.canonicalValue,
    canonicalUnit: item.canonicalUnit,
    effectiveAt: item.measuredAt,
    measuredAt: item.measuredAt,
    recordedAt: item.recordedAt,
  };
}

function compareTimelineItems(left: TimelineItem, right: TimelineItem): number {
  const effectiveTime =
    right.effectiveAt.getTime() - left.effectiveAt.getTime();
  if (effectiveTime !== 0) {
    return effectiveTime;
  }

  const recordedTime = right.recordedAt.getTime() - left.recordedAt.getTime();
  if (recordedTime !== 0) {
    return recordedTime;
  }

  const sourceDifference = sourceOrder[left.kind] - sourceOrder[right.kind];
  if (sourceDifference !== 0) {
    return sourceDifference;
  }

  const leftId =
    left.kind === 'measurement'
      ? left.measurementId
      : left.kind === 'observation'
        ? left.observationId
        : left.careWorkId;
  const rightId =
    right.kind === 'measurement'
      ? right.measurementId
      : right.kind === 'observation'
        ? right.observationId
        : right.careWorkId;
  return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
}

export class ReviewRecentTimeline {
  constructor(
    private readonly observationReader: TimelineObservationReader,
    private readonly measurementReader: TimelineMeasurementReader,
    private readonly careWorkReader: CareWorkReader,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(): Promise<readonly TimelineItem[]> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    const [observations, measurements, careWorks] = await Promise.all([
      this.observationReader.listRecentOwned(
        keeper.id,
        aquariumId,
        RECENT_TIMELINE_LIMIT,
      ),
      this.measurementReader.listRecentOwned(
        keeper.id,
        aquariumId,
        RECENT_TIMELINE_LIMIT,
      ),
      this.careWorkReader.listRecentOwned(
        keeper.id,
        aquariumId,
        RECENT_TIMELINE_LIMIT,
      ),
    ]);

    return [...observations, ...measurements, ...careWorks]
      .map((item) => toTimelineItem(item))
      .sort(compareTimelineItems)
      .slice(0, RECENT_TIMELINE_LIMIT);
  }
}
