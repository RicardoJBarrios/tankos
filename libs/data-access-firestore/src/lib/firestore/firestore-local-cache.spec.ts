import { describe, expect, it } from 'vitest';
import {
  createFirestoreLocalCache,
  type FirestoreLocalCacheMode,
} from './firestore-local-cache';

describe('createFirestoreLocalCache', () => {
  it('Given no options, When configured, Then uses a memory cache', () => {
    expect(createFirestoreLocalCache()).toBeDefined();
  });

  it('Given each supported persistent mode, When configured, Then creates a cache', () => {
    for (const mode of [
      'persistent-single-tab',
      'persistent-multi-tab',
    ] satisfies FirestoreLocalCacheMode[]) {
      expect(createFirestoreLocalCache({ mode })).toBeDefined();
    }
  });

  it('Given a cache size below one megabyte, When configured, Then rejects it', () => {
    expect(() =>
      createFirestoreLocalCache({
        mode: 'persistent-single-tab',
        cacheSizeBytes: 999_999,
      }),
    ).toThrow(RangeError);
  });

  it('Given a non-finite cache size, When configured, Then rejects it', () => {
    for (const cacheSizeBytes of [NaN, Infinity, -Infinity]) {
      expect(() =>
        createFirestoreLocalCache({
          mode: 'persistent-single-tab',
          cacheSizeBytes,
        }),
      ).toThrow(RangeError);
    }
  });

  it('Given an unsupported runtime mode, When configured, Then rejects it', () => {
    expect(() =>
      createFirestoreLocalCache({ mode: 'unsupported' as never }),
    ).toThrow(TypeError);
  });
});
