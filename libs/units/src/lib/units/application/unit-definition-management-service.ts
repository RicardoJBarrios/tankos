import type {
  AccessContext,
  CrudRepositoryPort,
  EntityId,
} from '@tankos/data-access';
import {
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
  UnitError,
  type UnitDefinition,
  type UnitDefinitionFilter,
  type UnitSymbolPosition,
  type UnitSymbolSpacing,
} from '../core';
import {
  createUnitDefinitionCrudService,
  type UnitDefinitionCrudService,
} from './unit-definition-crud-service';
import type { UnitDefinitionRecord } from './unit-definition-record';

/** Form data accepted by the custom-unit management use case. */
export interface CustomUnitDefinitionDraft {
  readonly code: string;
  readonly symbol: string;
  readonly asciiFallback: string;
  readonly position?: UnitSymbolPosition;
  readonly spacing?: UnitSymbolSpacing;
}

/** Request for creating a custom unit from its application input. */
export interface CreateCustomUnitRequest {
  readonly access: AccessContext;
  readonly draft: CustomUnitDefinitionDraft;
}

/** Request for replacing a custom unit using optimistic concurrency. */
export interface ReplaceCustomUnitRequest extends CreateCustomUnitRequest {
  readonly id: EntityId;
  readonly expectedRevision: number;
  /** Current version used to preserve public/private ownership on replacement. */
  readonly current?: UnitDefinition;
}

/** Request for promoting a private unit definition to the public catalogue. */
export interface PublishUnitDefinitionRequest {
  readonly access: AccessContext;
  readonly id: EntityId;
  readonly expectedRevision: number;
  readonly current: UnitDefinition;
  readonly currentLifecycle: UnitDefinitionRecord['lifecycle']['status'];
}

/**
 * Application service for the custom-unit form and CRUD lifecycle.
 *
 * Replacing an existing definition is deliberately versioned: the underlying
 * CRUD service creates the replacement and retires the previous record.
 */
export interface UnitDefinitionManagementService extends UnitDefinitionCrudService {
  save(
    request: CreateCustomUnitRequest | ReplaceCustomUnitRequest,
  ): Promise<UnitDefinitionRecord>;
  publish(request: PublishUnitDefinitionRequest): Promise<UnitDefinitionRecord>;
}

/**
 * Composes the custom-unit CRUD service with its application input mapping.
 * Existing records are never mutated by `save`; they are replaced by a new
 * version through the versioned CRUD service.
 */
export function createUnitDefinitionManagementService(
  repository: CrudRepositoryPort<
    UnitDefinition,
    UnitDefinition,
    UnitDefinition,
    UnitDefinitionFilter
  >,
): UnitDefinitionManagementService {
  const crud = createUnitDefinitionCrudService(repository);
  return {
    ...crud,
    save: (request) => saveUnitDefinition(crud, request),
    publish: (request) => publishUnitDefinition(crud, request),
  };
}

function saveUnitDefinition(
  crud: UnitDefinitionCrudService,
  request: CreateCustomUnitRequest | ReplaceCustomUnitRequest,
): Promise<UnitDefinitionRecord> {
  const definition =
    'current' in request && request.current
      ? replaceUnitDefinition(request.current, request.draft)
      : createCustomUnitDefinition(
          request.draft,
          request.access.principalId,
          request.access.principalName,
        );
  if ('id' in request) {
    return crud.replace(
      {
        access: request.access,
        id: request.id,
        expectedRevision: request.expectedRevision,
      },
      definition,
    );
  }
  return crud.create({ access: request.access, input: definition });
}

function publishUnitDefinition(
  crud: UnitDefinitionCrudService,
  request: PublishUnitDefinitionRequest,
): Promise<UnitDefinitionRecord> {
  if (request.currentLifecycle !== 'active') {
    return Promise.reject(
      new UnitError(
        'UNIT_PUBLISH_INVALID_STATE',
        'Only an active unit definition can be published',
      ),
    );
  }
  const { code, system, representation, catalogueVersion } = request.current;
  return crud.replace(
    {
      access: request.access,
      id: request.id,
      expectedRevision: request.expectedRevision,
    },
    createUnitDefinition({
      code,
      system,
      representation,
      catalogueVersion,
      visibility: 'public',
    }),
  );
}

function replaceUnitDefinition(
  current: UnitDefinition,
  draft: CustomUnitDefinitionDraft,
): UnitDefinition {
  return createUnitDefinition({
    ...current,
    code: current.code,
    representation: createUnitRepresentation({
      ...current.representation,
      symbol: draft.symbol,
      asciiFallback: draft.asciiFallback,
      position: draft.position ?? current.representation.position,
      spacing: draft.spacing ?? current.representation.spacing,
    }),
  });
}

/** Maps the custom-unit application input into the validated domain value. */
export function createCustomUnitDefinition(
  draft: CustomUnitDefinitionDraft,
  ownerId?: string,
  ownerName?: string,
): UnitDefinition {
  return createUnitDefinition({
    code: createUnitCode(draft.code),
    ...(ownerId === undefined ? {} : { ownerId }),
    visibility: ownerId === undefined ? 'public' : 'private',
    ...(ownerName === undefined ? {} : { ownerName }),
    system: 'custom',
    representation: createUnitRepresentation({
      symbol: draft.symbol,
      asciiFallback: draft.asciiFallback,
      position: draft.position ?? 'suffix',
      spacing: draft.spacing ?? 'narrow',
    }),
    catalogueVersion: 'TANKOS-CUSTOM-1',
  });
}
