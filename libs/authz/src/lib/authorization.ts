import type { EntityId } from '@tankos/data-access';

export interface AuthorizationSubject {
  readonly id: EntityId;
  readonly roles: readonly string[];
  readonly attributes?: Readonly<Record<string, unknown>>;
}

export interface AuthorizationResource<TAttributes = unknown> {
  readonly type: string;
  readonly id?: EntityId;
  readonly attributes: TAttributes;
}

export interface AuthorizationRequest<TAttributes = unknown> {
  readonly subject: AuthorizationSubject;
  readonly action: string;
  readonly resource: AuthorizationResource<TAttributes>;
  readonly environment?: Readonly<Record<string, unknown>>;
}

export type AuthorizationPolicy<TAttributes = unknown> = (
  request: AuthorizationRequest<TAttributes>,
) => boolean | Promise<boolean>;

export class AuthorizationDeniedError extends Error {
  public constructor(action: string, resourceType: string) {
    super(`Authorization denied for ${action} on ${resourceType}`);
    this.name = 'AuthorizationDeniedError';
  }
}

export interface AuthorizationPort<TAttributes = unknown> {
  readonly can: (
    request: AuthorizationRequest<TAttributes>,
  ) => Promise<boolean>;
  readonly authorize: (
    request: AuthorizationRequest<TAttributes>,
  ) => Promise<void>;
}

/** A persisted authorization fact, not a precomputed decision. */
export interface AuthorizationGrant {
  readonly id: EntityId;
  readonly subjectId: EntityId;
  readonly resourceType: string;
  readonly resourceId: EntityId;
  readonly actions: readonly string[];
  readonly effect: 'allow' | 'deny';
  readonly status: 'active' | 'revoked';
  readonly attributes?: Readonly<Record<string, unknown>>;
}

export interface AuthorizationGrantQuery {
  readonly subjectId: EntityId;
  readonly resourceType: string;
  readonly resourceId?: EntityId;
  readonly status?: AuthorizationGrant['status'];
}

/** Persistence boundary for authorization facts. */
export interface AuthorizationGrantStore {
  readonly find: (
    query: AuthorizationGrantQuery,
  ) => Promise<readonly AuthorizationGrant[]>;
  readonly save: (grant: AuthorizationGrant) => Promise<void>;
  readonly revoke: (grantId: EntityId) => Promise<void>;
}

export function createAuthorizationPort<TAttributes>(
  policy: AuthorizationPolicy<TAttributes>,
): AuthorizationPort<TAttributes> {
  return {
    can: (request) => Promise.resolve(policy(request)),
    authorize: async (request) => {
      if (await policy(request)) return;
      throw new AuthorizationDeniedError(request.action, request.resource.type);
    },
  };
}
