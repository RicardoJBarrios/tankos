import type {
  AccessContext,
  CrudRepositoryPort,
  EntityId,
} from '@tankos/data-access';
import {
  createDimensionSignature,
  createQuantityKind,
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
  type UnitDefinition,
  type UnitDefinitionFilter,
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
  readonly quantityKind: string;
  readonly conversionFamily: string;
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
    save: (request) => {
      const definition = createCustomUnitDefinition(
        request.draft,
        request.access.principalId,
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
    },
  };
}

/** Maps the custom-unit application input into the validated domain value. */
export function createCustomUnitDefinition(
  draft: CustomUnitDefinitionDraft,
  ownerId?: string,
): UnitDefinition {
  return createUnitDefinition({
    code: createUnitCode(draft.code),
    ...(ownerId === undefined
      ? {}
      : { ownerId, visibility: 'private' as const }),
    system: 'custom',
    dimension: createDimensionSignature(),
    quantityKind: createQuantityKind(draft.quantityKind),
    representation: createUnitRepresentation({
      symbol: draft.symbol,
      asciiFallback: draft.asciiFallback,
      position: 'suffix',
      spacing: 'narrow',
    }),
    conversionFamily: draft.conversionFamily,
    catalogueVersion: 'TANKOS-CUSTOM-1',
    status: 'active',
  });
}
