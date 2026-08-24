import {
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  persistentSingleTabManager,
  type FirestoreLocalCache,
} from 'firebase/firestore';

/** Supported local Firestore cache modes for a host application. */
export type FirestoreLocalCacheMode =
  'memory' | 'persistent-single-tab' | 'persistent-multi-tab';

/** Configuration for the optional Firestore local cache adapter. */
export interface FirestoreLocalCacheOptions {
  /** Defaults to the safe, non-persistent memory cache. */
  readonly mode?: FirestoreLocalCacheMode;
  /** Approximate persistent cache threshold in bytes. */
  readonly cacheSizeBytes?: number;
}

/**
 * Creates the Firestore local cache configuration for `initializeFirestore`.
 *
 * Persistence is opt-in because it retains cached documents and pending writes
 * across sessions. The host must obtain trusted-device consent before using a
 * persistent mode for private Aquarium data.
 */
export function createFirestoreLocalCache(
  options: FirestoreLocalCacheOptions = {},
): FirestoreLocalCache {
  const mode = options.mode ?? 'memory';
  if (mode === 'memory') return memoryLocalCache();
  if (mode !== 'persistent-single-tab' && mode !== 'persistent-multi-tab') {
    throw new TypeError(
      `Unsupported Firestore local cache mode: ${String(mode)}`,
    );
  }

  if (
    options.cacheSizeBytes !== undefined &&
    (!Number.isFinite(options.cacheSizeBytes) ||
      options.cacheSizeBytes < 1_000_000)
  ) {
    throw new RangeError('Firestore cache size must be at least 1 MB');
  }

  return persistentLocalCache({
    cacheSizeBytes: options.cacheSizeBytes,
    tabManager:
      mode === 'persistent-multi-tab'
        ? persistentMultipleTabManager()
        : persistentSingleTabManager(undefined),
  });
}
