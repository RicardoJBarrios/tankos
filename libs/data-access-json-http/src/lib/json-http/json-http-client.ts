import type { AccessContext } from '@tankos/data-access';

/** Provider-neutral HTTP client used by the JSON/HTTP repository adapter. */
export interface JsonHttpClientPort {
  request<TResponse>(request: {
    readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    readonly url: string;
    readonly access: AccessContext;
    readonly body?: unknown;
    /** Abort signal owned by the host transport, when supported. */
    readonly signal?: AbortSignal;
    /** Stable key the server can use to deduplicate mutations. */
    readonly idempotencyKey?: string;
  }): Promise<TResponse>;
}
