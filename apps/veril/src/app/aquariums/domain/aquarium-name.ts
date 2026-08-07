export class AquariumName {
  private constructor(readonly value: string) {}

  static create(value: string): AquariumName {
    const normalized = value.trim();

    if (!normalized) {
      throw new Error('AquariumName cannot be empty');
    }

    return new AquariumName(normalized);
  }
}
