import type {
  CachePort,
  CacheReadOptions,
  CrudRecord,
  CrudRepositoryPort,
  GetRequest,
  ListRequest,
  Page,
  RecordCommand,
} from '../../core';
import { createCacheNamespace } from '../../core';
import type {
  CachedCrudRepository,
  CachedCrudRepositoryOptions,
} from './cached-crud-repository';

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, child: unknown) => {
    if (isStableJsonLeaf(child)) return child;
    return Object.fromEntries(
      Object.entries(child as Record<string, unknown>).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    ) as Record<string, unknown>;
  });
}

function isStableJsonLeaf(value: unknown): boolean {
  return !value || typeof value !== 'object' || Array.isArray(value);
}

function isCacheFirst(options?: CacheReadOptions): boolean {
  return (options?.mode ?? 'cache-first') === 'cache-first';
}

/** Stateful cache decorator implementation. */
export class CachedCrudRepositoryImplementation<
  TData,
  TCreate,
  TUpdate,
  TFilter,
> implements CachedCrudRepository<TData, TCreate, TUpdate, TFilter> {
  readonly #namespace: string;
  readonly #backing: CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>;
  readonly #cache: CachePort<unknown>;
  readonly #options: CachedCrudRepositoryOptions;
  readonly #inFlight = new Map<string, Promise<unknown>>();
  #invalidationGeneration = 0;

  constructor(
    backing: CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>,
    cache: CachePort<unknown>,
    options: CachedCrudRepositoryOptions,
  ) {
    this.#backing = backing;
    this.#cache = cache;
    this.#options = options;
    if (
      !Number.isFinite(this.#options.ttlMilliseconds) ||
      this.#options.ttlMilliseconds <= 0
    )
      throw new RangeError('Cache TTL must be a positive finite number');
    this.#namespace = createCacheNamespace(this.#options.scope);
  }

  list(
    request: ListRequest<TFilter>,
    readOptions?: CacheReadOptions,
  ): Promise<Page<CrudRecord<TData>>> {
    const key = this.#listKey(request);
    const existing = this.#inFlight.get(key) as
      Promise<Page<CrudRecord<TData>>> | undefined;
    if (existing) return existing;
    const pending = this.#read<Page<CrudRecord<TData>>>(key, readOptions).then(
      (cached) => {
        if (cached !== undefined && isCacheFirst(readOptions)) return cached;
        return this.#loadList(key, request);
      },
    );
    this.#inFlight.set(key, pending);
    return pending.finally(() => this.#inFlight.delete(key));
  }

  get(
    request: GetRequest,
    readOptions?: CacheReadOptions,
  ): Promise<CrudRecord<TData> | undefined> {
    const key = this.#getKey(request);
    const existing = this.#inFlight.get(key) as
      Promise<CrudRecord<TData> | undefined> | undefined;
    if (existing) return existing;
    const pending = this.#read<CrudRecord<TData>>(key, readOptions).then(
      (cached) => {
        if (cached !== undefined && isCacheFirst(readOptions)) return cached;
        return this.#loadGet(key, request);
      },
    );
    this.#inFlight.set(key, pending);
    return pending.finally(() => this.#inFlight.delete(key));
  }

  async create(
    input: Parameters<
      CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>['create']
    >[0],
  ) {
    const result = await this.#backing.create(input);
    await this.#invalidate();
    return result;
  }

  async replace(request: RecordCommand, input: TUpdate) {
    const result = await this.#backing.replace(request, input);
    await this.#invalidate();
    return result;
  }

  async markForDeletion(request: RecordCommand) {
    const result = await this.#backing.markForDeletion(request);
    await this.#invalidate();
    return result;
  }

  async restore(request: RecordCommand) {
    const result = await this.#backing.restore(request);
    await this.#invalidate();
    return result;
  }

  async delete(request: RecordCommand): Promise<void> {
    await this.#backing.delete(request);
    await this.#invalidate();
  }

  async #read<T>(
    key: string,
    options?: CacheReadOptions,
  ): Promise<T | undefined> {
    try {
      return (await this.#cache.get(key, options)) as T | undefined;
    } catch (error) {
      this.#options.onCacheError?.(error);
      return undefined;
    }
  }

  #listKey(request: ListRequest<TFilter>): string {
    return `${this.#namespace}:list:${stableJson(request)}`;
  }

  #getKey(request: GetRequest): string {
    return `${this.#namespace}:get:${stableJson({ id: request.id, access: request.access, lifecycle: request.lifecycle })}`;
  }

  async #loadList(
    key: string,
    request: ListRequest<TFilter>,
  ): Promise<Page<CrudRecord<TData>>> {
    const generation = this.#invalidationGeneration;
    try {
      const result = await this.#backing.list(request);
      if (generation === this.#invalidationGeneration)
        await this.#write(key, result);
      return result;
    } finally {
      this.#inFlight.delete(key);
    }
  }

  async #loadGet(
    key: string,
    request: GetRequest,
  ): Promise<CrudRecord<TData> | undefined> {
    const generation = this.#invalidationGeneration;
    try {
      const result = await this.#backing.get(request);
      if (result !== undefined && generation === this.#invalidationGeneration) {
        await this.#write(key, result);
      }
      return result;
    } finally {
      this.#inFlight.delete(key);
    }
  }

  async #write(key: string, value: unknown): Promise<void> {
    try {
      await this.#cache.set(key, value, this.#options.ttlMilliseconds);
    } catch (error) {
      this.#options.onCacheError?.(error);
    }
  }

  async #invalidate(): Promise<void> {
    this.#invalidationGeneration += 1;
    this.#inFlight.clear();
    try {
      await this.#cache.clearNamespace(this.#namespace);
    } catch (error) {
      this.#options.onCacheError?.(error);
    }
  }
}
