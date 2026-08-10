import { describe, expect, it } from 'vitest';
import {
  AquariumLocation,
  AquariumName,
  aquariumIdFrom,
  createAquariumId,
} from './aquarium';

describe('Aquarium domain', () => {
  it('creates an independent UUID v4 for every Aquarium', () => {
    const first = createAquariumId();
    const second = createAquariumId();

    expect(first).not.toBe(second);
    expect(() => aquariumIdFrom(first)).not.toThrow();
    expect(() => aquariumIdFrom(second)).not.toThrow();
  });

  it('normalizes a non-empty AquariumName', () => {
    expect(AquariumName.create('  Veril  ').value).toBe('Veril');
  });

  it('rejects an empty AquariumName', () => {
    expect(() => AquariumName.create('   ')).toThrow();
  });

  it('rounds an approximate location and rejects invalid coordinates', () => {
    expect(
      AquariumLocation.create({
        latitude: 28.123,
        longitude: -16.456,
        displayName: 'Santa Cruz de Tenerife, España',
      }),
    ).toEqual({
      latitude: 28.12,
      longitude: -16.46,
      displayName: 'Santa Cruz de Tenerife, España',
    });
    expect(() =>
      AquariumLocation.create({
        latitude: 91,
        longitude: 0,
        displayName: 'Lugar',
      }),
    ).toThrow();
  });
});
