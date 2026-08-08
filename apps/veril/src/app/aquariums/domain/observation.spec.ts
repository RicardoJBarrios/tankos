import { describe, expect, it } from 'vitest';
import { aquariumIdFrom } from './aquarium';
import { createObservation, observationIdFrom } from './observation';

const input = {
  id: observationIdFrom('123e4567-e89b-42d3-a456-426614174002'),
  aquariumId: aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000'),
  recordedAt: new Date('2026-08-08T10:00:00.000Z'),
};

describe('Observation', () => {
  it('trims and preserves non-empty qualitative evidence', () => {
    expect(
      createObservation({ ...input, content: '  El coral está abierto  ' }),
    ).toMatchObject({ content: 'El coral está abierto' });
  });

  it('rejects empty evidence', () => {
    expect(() => createObservation({ ...input, content: '   ' })).toThrow(
      'Observation content must not be empty',
    );
  });

  it('rejects a non-UUID ObservationId', () => {
    expect(() => observationIdFrom('observation-1')).toThrow(
      'ObservationId must be a UUID v4',
    );
  });
});
