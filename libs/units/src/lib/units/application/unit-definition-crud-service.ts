import {
  createCrudService,
  createVersionedCrudService,
  type CrudRepositoryPort,
  type CrudService,
} from '@tankos/data-access';
import type { UnitDefinition, UnitDefinitionFilter } from '../core';
import { unitDefinitionCrudPolicy } from './unit-definition-authorization';

/** Input accepted when creating or replacing any unit definition. */
export type CustomUnitDefinitionInput = UnitDefinition;

/** CRUD application boundary for the public and private unit catalogue. */
export type UnitDefinitionCrudService = CrudService<
  UnitDefinition,
  CustomUnitDefinitionInput,
  CustomUnitDefinitionInput,
  UnitDefinitionFilter
>;

/**
 * Creates the unit-definition CRUD service.
 *
 * The repository supplied here must be scoped to the unit catalogue. Public
 * and private definitions use the same versioned workflow.
 */
export function createUnitDefinitionCrudService(
  repository: CrudRepositoryPort<
    UnitDefinition,
    CustomUnitDefinitionInput,
    CustomUnitDefinitionInput,
    UnitDefinitionFilter
  >,
): UnitDefinitionCrudService {
  const crud = createCrudService(repository, {
    policy: unitDefinitionCrudPolicy,
  });
  const custom: Omit<UnitDefinitionCrudService, 'replace'> = {
    list: (request) => crud.list(request),
    get: (request) => crud.get(request),
    markForDeletion: (request) => crud.markForDeletion(request),
    restore: (request) => crud.restore(request),
    delete: (request) => crud.delete(request),
    create: (request) => crud.create(request),
  };
  return createVersionedCrudService(custom, {
    toCreateInput: (input) => input,
    ...(repository.replaceVersioned
      ? { replaceAtomically: repository.replaceVersioned.bind(repository) }
      : {}),
    validateReplace: (access, current, input) =>
      unitDefinitionCrudPolicy.validateUpdate?.(access, current, input),
  });
}
