import { describe, expect, it } from 'vitest';
import { aquariumIdFrom } from '../../shared/domain/aquarium-reference';
import {
  createPlannedCareWork,
  createPlannedCareWorkId,
  plannedCareWorkIdFrom,
} from './planned-care-work';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

describe('PlannedCareWork', () => {
  it('creates an independent planned intention with its identity', () => {
    const plannedFor = new Date('2026-08-10T10:00:00.000Z');
    const recordedAt = new Date('2026-08-09T10:00:00.000Z');
    const planned = createPlannedCareWork({
      id: createPlannedCareWorkId(),
      aquariumId,
      description: 'Limpiar la copa del skimmer',
      plannedFor,
      recordedAt,
      provenance: 'manual',
    });

    expect(planned).toMatchObject({
      aquariumId,
      description: 'Limpiar la copa del skimmer',
      plannedFor,
      recordedAt,
      provenance: 'manual',
    });
    expect(planned.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('trims and validates the intention without requiring a future date', () => {
    const plannedFor = new Date('2026-08-08T10:00:00.000Z');
    const recordedAt = new Date('2026-08-09T10:00:00.000Z');

    expect(
      createPlannedCareWork({
        id: plannedCareWorkIdFrom('123e4567-e89b-42d3-a456-426614174001'),
        aquariumId,
        description: '  Revisar el nivel  ',
        plannedFor,
        recordedAt,
        provenance: 'manual',
      }).description,
    ).toBe('Revisar el nivel');
    expect(() =>
      createPlannedCareWork({
        id: createPlannedCareWorkId(),
        aquariumId,
        description: ' ',
        plannedFor,
        recordedAt,
        provenance: 'manual',
      }),
    ).toThrow('description');
    expect(() => plannedCareWorkIdFrom('invalid')).toThrow('UUID v4');
  });
});
