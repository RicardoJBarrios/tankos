import { describe, expect, it } from 'vitest';
import { AquariumName, aquariumIdFrom, createAquariumId } from './aquarium';

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
});
