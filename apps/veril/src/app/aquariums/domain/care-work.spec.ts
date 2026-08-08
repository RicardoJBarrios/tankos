import { describe, expect, it } from 'vitest';
import { aquariumIdFrom } from './aquarium';
import { careWorkIdFrom, createCareWork, createCareWorkId } from './care-work';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const performedAt = new Date('2026-08-08T10:00:00.000Z');
const recordedAt = new Date('2026-08-08T10:05:00.000Z');

describe('CareWork', () => {
  it('creates a UUID v4 identity', () => {
    expect(createCareWorkId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('rejects invalid identities', () => {
    expect(() => careWorkIdFrom('not-an-id')).toThrow('UUID v4');
  });

  it('trims and preserves the two care times and provenance', () => {
    const careWork = createCareWork({
      id: createCareWorkId(),
      aquariumId,
      description: '  Limpié la copa del skimmer  ',
      performedAt,
      recordedAt,
      provenance: 'manual',
    });

    expect(careWork).toMatchObject({
      aquariumId,
      description: 'Limpié la copa del skimmer',
      performedAt,
      recordedAt,
      provenance: 'manual',
    });
  });

  it('rejects empty descriptions and invalid times', () => {
    const input = {
      id: createCareWorkId(),
      aquariumId,
      description: '   ',
      performedAt,
      recordedAt,
      provenance: 'manual' as const,
    };
    expect(() => createCareWork(input)).toThrow('description');
    expect(() =>
      createCareWork({
        ...input,
        description: 'Limpieza',
        performedAt: new Date('invalid'),
      }),
    ).toThrow('performedAt');
    expect(() =>
      createCareWork({
        ...input,
        description: 'Limpieza',
        recordedAt: new Date('invalid'),
      }),
    ).toThrow('recordedAt');
  });
});
