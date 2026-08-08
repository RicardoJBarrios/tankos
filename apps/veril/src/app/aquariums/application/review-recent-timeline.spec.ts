import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../domain/aquarium';
import { ActiveAquariumContext } from './active-aquarium-context';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';
import {
  CareWorkListItem,
  CareWorkReader,
  KeeperSession,
  MeasurementListItem,
  TimelineMeasurementReader,
  TimelineObservationReader,
  ObservationListItem,
} from './aquarium-ports';
import {
  RECENT_TIMELINE_LIMIT,
  ReviewRecentTimeline,
} from './review-recent-timeline';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

function setup() {
  const observationReader: TimelineObservationReader = {
    listRecentOwned: vi.fn(),
  };
  const measurementReader: TimelineMeasurementReader = {
    listRecentOwned: vi.fn(),
  };
  const careWorkReader: CareWorkReader = {
    listRecentOwned: vi.fn(),
  };
  const keeperSession: KeeperSession = {
    requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-a' }),
  };
  const storage: ActiveAquariumContextStorage = {
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  };
  const context = new ActiveAquariumContext(storage);
  context.select(aquariumId);

  return {
    observationReader,
    measurementReader,
    careWorkReader,
    keeperSession,
    context,
    review: new ReviewRecentTimeline(
      observationReader,
      measurementReader,
      careWorkReader,
      keeperSession,
      context,
    ),
  };
}

const observation = (id: string, recordedAt: string): ObservationListItem => ({
  id: id as ObservationListItem['id'],
  content: `Observación ${id}`,
  recordedAt: new Date(recordedAt),
});

const measurement = (
  id: string,
  measuredAt: string,
  recordedAt = measuredAt,
): MeasurementListItem => ({
  id: id as MeasurementListItem['id'],
  parameterId: 'temperature',
  canonicalValue: 23,
  canonicalUnit: 'celsius',
  measuredAt: new Date(measuredAt),
  recordedAt: new Date(recordedAt),
  provenance: 'manual',
});

const careWork = (
  id: string,
  performedAt: string,
  recordedAt = performedAt,
): CareWorkListItem => ({
  id: id as CareWorkListItem['id'],
  description: `Cuidado ${id}`,
  performedAt: new Date(performedAt),
  recordedAt: new Date(recordedAt),
});

describe('ReviewRecentTimeline', () => {
  it('requires authentication and Active Context before reading either source', async () => {
    const {
      review,
      keeperSession,
      observationReader,
      measurementReader,
      careWorkReader,
    } = setup();
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockRejectedValue(
      new Error('Authentication unavailable'),
    );

    await expect(review.execute()).rejects.toThrow(
      'Authentication unavailable',
    );
    expect(observationReader.listRecentOwned).not.toHaveBeenCalled();
    expect(measurementReader.listRecentOwned).not.toHaveBeenCalled();
    expect(careWorkReader.listRecentOwned).not.toHaveBeenCalled();
  });

  it('does not query without an active Aquarium', async () => {
    const {
      review,
      context,
      observationReader,
      measurementReader,
      careWorkReader,
    } = setup();
    context.clear();

    await expect(review.execute()).rejects.toThrow(
      'Aquarium context is required',
    );
    expect(observationReader.listRecentOwned).not.toHaveBeenCalled();
    expect(measurementReader.listRecentOwned).not.toHaveBeenCalled();
    expect(careWorkReader.listRecentOwned).not.toHaveBeenCalled();
  });

  it('returns an empty result when both sources are empty', async () => {
    const { review, observationReader, measurementReader, careWorkReader } =
      setup();
    vi.mocked(observationReader.listRecentOwned).mockResolvedValue([]);
    vi.mocked(measurementReader.listRecentOwned).mockResolvedValue([]);
    vi.mocked(careWorkReader.listRecentOwned).mockResolvedValue([]);

    await expect(review.execute()).resolves.toEqual([]);
  });

  it('merges observations and measurements using the canonical order', async () => {
    const { review, observationReader, measurementReader, careWorkReader } =
      setup();
    const sameTime = '2026-08-08T10:00:00.000Z';
    vi.mocked(observationReader.listRecentOwned).mockResolvedValue([
      observation('123e4567-e89b-42d3-a456-426614174002', sameTime),
    ]);
    vi.mocked(measurementReader.listRecentOwned).mockResolvedValue([
      measurement('123e4567-e89b-42d3-a456-426614174001', sameTime),
    ]);
    vi.mocked(careWorkReader.listRecentOwned).mockResolvedValue([
      careWork('123e4567-e89b-42d3-a456-426614174003', sameTime),
    ]);

    const items = await review.execute();

    expect(items.map((item) => item.kind)).toEqual([
      'measurement',
      'observation',
      'care-work',
    ]);
    expect(items[0]).toMatchObject({ effectiveAt: new Date(sameTime) });
  });

  it('uses source identifiers as the final tie-breaker within each source type', async () => {
    const { review, observationReader, measurementReader, careWorkReader } =
      setup();
    const sameTime = '2026-08-08T10:00:00.000Z';
    vi.mocked(observationReader.listRecentOwned).mockResolvedValue([
      observation('123e4567-e89b-42d3-a456-426614174002', sameTime),
      observation('123e4567-e89b-42d3-a456-426614174001', sameTime),
    ]);
    vi.mocked(measurementReader.listRecentOwned).mockResolvedValue([
      measurement('123e4567-e89b-42d3-a456-426614174004', sameTime),
      measurement('123e4567-e89b-42d3-a456-426614174003', sameTime),
    ]);
    vi.mocked(careWorkReader.listRecentOwned).mockResolvedValue([
      careWork('123e4567-e89b-42d3-a456-426614174003', sameTime),
      careWork('123e4567-e89b-42d3-a456-426614174002', sameTime),
    ]);

    const items = await review.execute();

    expect(
      items.map((item) =>
        item.kind === 'measurement'
          ? item.measurementId
          : item.kind === 'observation'
            ? item.observationId
            : item.careWorkId,
      ),
    ).toEqual([
      '123e4567-e89b-42d3-a456-426614174003',
      '123e4567-e89b-42d3-a456-426614174004',
      '123e4567-e89b-42d3-a456-426614174001',
      '123e4567-e89b-42d3-a456-426614174002',
      '123e4567-e89b-42d3-a456-426614174002',
      '123e4567-e89b-42d3-a456-426614174003',
    ]);
  });

  it('uses Care Work performedAt as effective time', async () => {
    const { review, observationReader, measurementReader, careWorkReader } =
      setup();
    vi.mocked(observationReader.listRecentOwned).mockResolvedValue([]);
    vi.mocked(measurementReader.listRecentOwned).mockResolvedValue([]);
    vi.mocked(careWorkReader.listRecentOwned).mockResolvedValue([
      careWork(
        '123e4567-e89b-42d3-a456-426614174005',
        '2026-08-08T08:00:00.000Z',
        '2026-08-08T10:00:00.000Z',
      ),
    ]);

    const [item] = await review.execute();

    expect(item).toMatchObject({
      kind: 'care-work',
      effectiveAt: new Date('2026-08-08T08:00:00.000Z'),
      performedAt: new Date('2026-08-08T08:00:00.000Z'),
      recordedAt: new Date('2026-08-08T10:00:00.000Z'),
    });
  });

  it('uses Measurement measuredAt as effective time and keeps recordedAt as a tie-breaker', async () => {
    const { review, observationReader, measurementReader, careWorkReader } =
      setup();
    vi.mocked(observationReader.listRecentOwned).mockResolvedValue([
      observation(
        '123e4567-e89b-42d3-a456-426614174002',
        '2026-08-08T10:00:00.000Z',
      ),
    ]);
    vi.mocked(measurementReader.listRecentOwned).mockResolvedValue([
      measurement(
        '123e4567-e89b-42d3-a456-426614174001',
        '2026-08-08T10:00:00.000Z',
        '2026-08-08T10:05:00.000Z',
      ),
    ]);
    vi.mocked(careWorkReader.listRecentOwned).mockResolvedValue([]);

    const items = await review.execute();

    expect(items.map((item) => item.kind)).toEqual([
      'measurement',
      'observation',
    ]);
  });

  it('returns the global top bound when one source has more than the limit', async () => {
    const { review, observationReader, measurementReader, careWorkReader } =
      setup();
    const observations = Array.from(
      { length: RECENT_TIMELINE_LIMIT + 5 },
      (_, index) =>
        observation(
          `123e4567-e89b-42d3-a456-42661417${String(500 + index).padStart(4, '0')}`,
          new Date(
            Date.parse('2026-08-08T23:00:00.000Z') - index * 60_000,
          ).toISOString(),
        ),
    );
    const measurements = [
      measurement(
        '123e4567-e89b-42d3-a456-426614174999',
        '2026-08-08T22:50:00.000Z',
      ),
    ];
    vi.mocked(observationReader.listRecentOwned).mockResolvedValue(
      observations,
    );
    vi.mocked(measurementReader.listRecentOwned).mockResolvedValue(
      measurements,
    );
    vi.mocked(careWorkReader.listRecentOwned).mockResolvedValue([]);

    const items = await review.execute();

    expect(items).toHaveLength(RECENT_TIMELINE_LIMIT);
    expect(items[RECENT_TIMELINE_LIMIT - 1]?.kind).toBe('observation');
    expect(items.some((item) => item.kind === 'measurement')).toBe(true);
  });

  it('fails as a whole when either source fails', async () => {
    const { review, observationReader, measurementReader, careWorkReader } =
      setup();
    vi.mocked(observationReader.listRecentOwned).mockRejectedValue(
      new Error('Observation source unavailable'),
    );
    vi.mocked(measurementReader.listRecentOwned).mockResolvedValue([]);
    vi.mocked(careWorkReader.listRecentOwned).mockResolvedValue([]);

    await expect(review.execute()).rejects.toThrow(
      'Observation source unavailable',
    );
  });
});
