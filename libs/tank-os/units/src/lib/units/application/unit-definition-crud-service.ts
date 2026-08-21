import {
  createCrudService,
  type CrudRepositoryPort,
  type CrudService,
} from '@tank-os/data-access';
import type { UnitDefinition, UnitDefinitionFilter } from '../core';
import { UnitError } from '../core';

/** Input accepted when creating or replacing a custom unit definition. */
export type CustomUnitDefinitionInput = UnitDefinition;

/** CRUD application boundary for the global custom unit catalogue. */
export type UnitDefinitionCrudService = CrudService<
  UnitDefinition,
  CustomUnitDefinitionInput,
  CustomUnitDefinitionInput,
  UnitDefinitionFilter
>;

/**
 * Creates the custom-unit CRUD service.
 *
 * The repository supplied here must be scoped to the global custom-unit
 * catalogue. Standard catalogue entries are immutable and are not accepted by
 * this service.
 */
export function createUnitDefinitionCrudService(
  repository: CrudRepositoryPort<
    UnitDefinition,
    CustomUnitDefinitionInput,
    CustomUnitDefinitionInput,
    UnitDefinitionFilter
  >,
): UnitDefinitionCrudService {
  const crud = createCrudService(repository);
  return {
    ...crud,
    create: async (request) =>
      crud.create({ ...request, input: requireCustom(request.input) }),
    replace: async (request, input) => crud.replace(request, requireCustom(input)),
  };
}

function requireCustom(input: CustomUnitDefinitionInput): CustomUnitDefinitionInput {
  if (input.system !== 'custom') {
    throw new UnitError(
      'UNIT_CUSTOM_REQUIRED',
      'Custom unit management accepts only definitions with system custom',
    );
  }

  return input;
}
