import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../domain/aquarium';
import { ActiveAquariumContext } from './active-aquarium-context';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';

const firstId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const secondId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174001');

function setup() {
  const storage: ActiveAquariumContextStorage = {
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  };

  return { storage, context: new ActiveAquariumContext(storage) };
}

describe('ActiveAquariumContext', () => {
  it('starts empty, persists selections and replaces the previous selection', () => {
    const { context, storage } = setup();

    expect(context.get()).toBeNull();

    context.select(firstId);
    context.select(secondId);

    expect(context.get()).toBe(secondId);
    expect(storage.save).toHaveBeenNthCalledWith(1, firstId);
    expect(storage.save).toHaveBeenNthCalledWith(2, secondId);
  });

  it('does not rewrite storage for the existing selection and clears both states', () => {
    const { context, storage } = setup();
    context.select(firstId);

    context.select(firstId);
    context.clear();

    expect(storage.save).toHaveBeenCalledOnce();
    expect(context.get()).toBeNull();
    expect(storage.clear).toHaveBeenCalledOnce();
  });
});
