import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../shared/application/active-aquarium-context-storage';
import { ReadAquariumDashboardContext } from '../../aquarium-management/application/read-aquarium-dashboard-context';
import { ReviewCurrentMeasurements } from '../../measurements/application/review-current-measurements';
import { AquariumDashboardContext } from '../../aquarium-management/application/ports';
import { CurrentMeasurementValue } from '../../measurements/application/ports';
import {
  AquariumName,
  aquariumIdFrom,
} from '../../aquarium-management/domain/aquarium';
import { AquariumDashboardStore } from './aquarium-dashboard-store';

const firstId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const secondId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174001');
const firstContext: AquariumDashboardContext = {
  id: firstId,
  name: AquariumName.create('Veril'),
  parameterTargets: {
    temperature: { parameterId: 'temperature', minimum: 24, maximum: 25 },
  },
};

describe('AquariumDashboardStore', () => {
  const read = vi.fn();
  const review = vi.fn();
  let context: ActiveAquariumContext;

  beforeEach(() => {
    read.mockReset();
    review.mockReset();
    review.mockResolvedValue([]);
    const storage: ActiveAquariumContextStorage = {
      load: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
    };
    context = new ActiveAquariumContext(storage);
    context.select(firstId);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AquariumDashboardStore,
        { provide: ReadAquariumDashboardContext, useValue: { execute: read } },
        { provide: ReviewCurrentMeasurements, useValue: { execute: review } },
        { provide: ActiveAquariumContext, useValue: context },
      ],
    });
  });

  it('loads the selected Dashboard context including targets', async () => {
    read.mockResolvedValue(firstContext);
    const store = TestBed.inject(AquariumDashboardStore);

    await store.load();

    expect(store.status()).toBe('ready');
    expect(store.aquariumName()).toBe('Veril');
    expect(store.parameterTargets()).toEqual(firstContext.parameterTargets);
  });

  it('does not query without an Active Context', async () => {
    context.clear();
    const store = TestBed.inject(AquariumDashboardStore);

    await store.load();

    expect(store.status()).toBe('no-context');
    expect(read).not.toHaveBeenCalled();
  });

  it('clears previous targets when the active Aquarium changes', async () => {
    read.mockResolvedValueOnce(firstContext).mockResolvedValueOnce({
      id: secondId,
      name: AquariumName.create('Otro acuario'),
      parameterTargets: {},
    });
    const store = TestBed.inject(AquariumDashboardStore);
    await store.load();

    context.select(secondId);
    await store.reload();

    expect(store.aquariumName()).toBe('Otro acuario');
    expect(store.parameterTargets()).toEqual({});
  });

  it('derives status from current Measurements and targets in the Store', async () => {
    const temperature: CurrentMeasurementValue = {
      parameterId: 'temperature',
      canonicalValue: 25.4,
      canonicalUnit: 'celsius',
      measuredAt: new Date('2026-08-10T10:00:00.000Z'),
    };
    read.mockResolvedValue(firstContext);
    review.mockResolvedValue([temperature]);
    const store = TestBed.inject(AquariumDashboardStore);

    await store.load();

    expect(store.currentMeasurements()).toEqual([temperature]);
    expect(store.currentParameterStates()[0]).toMatchObject({
      measurement: temperature,
      target: firstContext.parameterTargets.temperature,
      interpretation: 'above',
    });
    expect(store.currentParameterStates()[1]).toMatchObject({
      measurement: null,
      interpretation: undefined,
    });
  });

  it('isolates current Measurement failure from Dashboard context', async () => {
    read.mockResolvedValue(firstContext);
    review.mockRejectedValue(new Error('reader unavailable'));
    const store = TestBed.inject(AquariumDashboardStore);

    await store.load();

    expect(store.status()).toBe('ready');
    expect(store.currentMeasurementsError()).toBe(true);
    expect(store.currentMeasurementsLoading()).toBe(false);
  });

  it('resets current Measurements and derived state when Aquarium changes', async () => {
    const temperature: CurrentMeasurementValue = {
      parameterId: 'temperature',
      canonicalValue: 25.4,
      canonicalUnit: 'celsius',
      measuredAt: new Date('2026-08-10T10:00:00.000Z'),
    };
    read.mockResolvedValueOnce(firstContext).mockResolvedValueOnce({
      id: secondId,
      name: AquariumName.create('Otro acuario'),
      parameterTargets: {},
    });
    review.mockResolvedValueOnce([temperature]).mockResolvedValueOnce([]);
    const store = TestBed.inject(AquariumDashboardStore);
    await store.load();
    expect(store.currentParameterStates()[0].measurement).toEqual(temperature);

    context.select(secondId);
    await store.reload();

    expect(store.currentMeasurements()).toEqual([]);
    expect(store.currentParameterStates()[0]).toMatchObject({
      measurement: null,
      target: undefined,
      interpretation: undefined,
    });
  });
});
