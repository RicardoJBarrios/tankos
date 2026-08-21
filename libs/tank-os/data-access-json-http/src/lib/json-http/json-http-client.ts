import type { AccessContext } from '@tank-os/data-access';

/** Provider-neutral HTTP client used by the JSON/HTTP repository adapter. */
export interface JsonHttpClientPort {
  request<TResponse>(request: {
    readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    readonly url: string;
    readonly access: AccessContext;
    readonly body?: unknown;
  }): Promise<TResponse>;
}
