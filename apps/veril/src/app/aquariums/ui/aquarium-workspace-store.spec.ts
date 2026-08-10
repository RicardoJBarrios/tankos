import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../application/active-aquarium-context-storage';
import { ReadAquariumDashboardContext } from '../application/read-aquarium-dashboard-context';
import { RemoveParameterTarget } from '../application/remove-parameter-target';
import { ReviewCurrentMeasurements } from '../application/review-current-measurements';
import { SaveParameterTarget } from '../application/save-parameter-target';
import {
  AquariumDashboardContext,
  CurrentMeasurementValue,
} from '../application/aquarium-ports';
import { AquariumName, aquariumIdFrom } from '../domain/aquarium';
import { AquariumWorkspaceStore } from './aquarium-workspace-store';

const firstId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const secondId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174001');
const firstContext: AquariumDashboardContext = {
  id: firstId,
  name: AquariumName.create('Veril'),
  parameterTargets: {
    temperature: { parameterId: 'temperature', minimum: 24, maximum: 25 },
  },
};

describe('AquariumWorkspaceStore', () => {
  const read = vi.fn();
  const save = vi.fn();
  const remove = vi.fn();
  const review = vi.fn();
  let context: ActiveAquariumContext;

  beforeEach(() => {
    read.mockReset();
    save.mockReset();
    remove.mockReset();
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
        AquariumWorkspaceStore,
        { provide: ReadAquariumDashboardContext, useValue: { execute: read } },
        { provide: SaveParameterTarget, useValue: { execute: save } },
        { provide: RemoveParameterTarget, useValue: { execute: remove } },
        { provide: ReviewCurrentMeasurements, useValue: { execute: review } },
        { provide: ActiveAquariumContext, useValue: context },
      ],
    });
  });

  it('loads the selected Dashboard context including targets', async () => {
    read.mockResolvedValue(firstContext);
    const store = TestBed.inject(AquariumWorkspaceStore);

    await store.load();

    expect(store.status()).toBe('ready');
    expect(store.aquariumName()).toBe('Veril');
    expect(store.targetFor('temperature')).toEqual(
      firstContext.parameterTargets.temperature,
    );
    expect(store.hasTarget('temperature')).toBe(true);
    expect(store.hasTarget('salinity')).toBe(false);
  });

  it('does not query without an Active Context', async () => {
    context.clear();
    const store = TestBed.inject(AquariumWorkspaceStore);

    await store.load();

    expect(store.status()).toBe('no-context');
    expect(read).not.toHaveBeenCalled();
  });

  it('synchronizes successful save and remove mutations without a reload', async () => {
    read.mockResolvedValue(firstContext);
    save.mockResolvedValue({
      parameterId: 'salinity',
      minimum: 34,
      maximum: 35,
    });
    const store = TestBed.inject(AquariumWorkspaceStore);
    await store.load();

    await store.saveTarget('salinity', 34, 35);
    expect(store.targetFor('salinity')).toEqual({
      parameterId: 'salinity',
      minimum: 34,
      maximum: 35,
    });

    await store.removeTarget('temperature');
    expect(store.hasTarget('temperature')).toBe(false);
  });

  it('preserves the existing target state when a mutation fails', async () => {
    read.mockResolvedValue(firstContext);
    remove.mockRejectedValueOnce(new Error('Firestore unavailable'));
    const store = TestBed.inject(AquariumWorkspaceStore);
    await store.load();

    await expect(store.removeTarget('temperature')).rejects.toThrow(
      'Firestore unavailable',
    );
    expect(store.targetFor('temperature')).toEqual(
      firstContext.parameterTargets.temperature,
    );
  });

  it('clears previous targets when the active Aquarium changes', async () => {
    read.mockResolvedValueOnce(firstContext).mockResolvedValueOnce({
      id: secondId,
      name: AquariumName.create('Otro acuario'),
      parameterTargets: {},
    });
    const store = TestBed.inject(AquariumWorkspaceStore);
    await store.load();

    context.select(secondId);
    await store.reload();

    expect(store.aquariumName()).toBe('Otro acuario');
    expect(store.hasTarget('temperature')).toBe(false);
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
    const store = TestBed.inject(AquariumWorkspaceStore);

    await store.load();

    expect(store.currentMeasurements()).toEqual([temperature]);
    expect(store.currentParameterStateFor('temperature')).toMatchObject({
      measurement: temperature,
      target: firstContext.parameterTargets.temperature,
      interpretation: 'above',
    });
    expect(store.currentParameterStateFor('salinity')).toMatchObject({
      measurement: null,
      interpretation: undefined,
    });
  });

  it('recomputes status after target edit and removal without refetching Measurements', async () => {
    const temperature: CurrentMeasurementValue = {
      parameterId: 'temperature',
      canonicalValue: 25.4,
      canonicalUnit: 'celsius',
      measuredAt: new Date('2026-08-10T10:00:00.000Z'),
    };
    read.mockResolvedValue(firstContext);
    review.mockResolvedValue([temperature]);
    save.mockResolvedValue({
      parameterId: 'temperature',
      minimum: 20,
      maximum: 22,
    });
    const store = TestBed.inject(AquariumWorkspaceStore);
    await store.load();

    await store.saveTarget('temperature', 20, 22);
    expect(store.currentParameterStateFor('temperature').interpretation).toBe(
      'above',
    );
    expect(review).toHaveBeenCalledTimes(1);

    await store.removeTarget('temperature');
    expect(store.currentParameterStateFor('temperature').interpretation).toBe(
      'uninterpreted',
    );
    expect(review).toHaveBeenCalledTimes(1);
  });

  it('isolates current Measurement failure from Dashboard context', async () => {
    read.mockResolvedValue(firstContext);
    review.mockRejectedValue(new Error('reader unavailable'));
    const store = TestBed.inject(AquariumWorkspaceStore);

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
    const store = TestBed.inject(AquariumWorkspaceStore);
    await store.load();
    expect(store.currentParameterStateFor('temperature').measurement).toEqual(
      temperature,
    );

    context.select(secondId);
    await store.reload();

    expect(store.currentMeasurements()).toEqual([]);
    expect(store.currentParameterStateFor('temperature')).toMatchObject({
      measurement: null,
      target: undefined,
      interpretation: undefined,
    });
  });
});
