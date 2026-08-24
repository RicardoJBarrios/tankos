import {
  createCrudService,
  createVersionedCrudService,
  type CrudRepositoryPort,
  type CrudService,
} from '@tank-os/data-access';
import type {
  ConversionDefinition,
  ConversionDefinitionFilter,
} from '../core';
import { UnitError } from '../core';

/** Input accepted when creating or replacing a custom conversion definition. */
export type CustomConversionDefinitionInput = ConversionDefinition;

/** CRUD application boundary for the global custom conversion catalogue. */
export type ConversionDefinitionCrudService = CrudService<
  ConversionDefinition,
  CustomConversionDefinitionInput,
  CustomConversionDefinitionInput,
  ConversionDefinitionFilter
>;

/**
 * Creates the custom-conversion CRUD service.
 *
 * Standard conversion definitions are fixed catalogue entries and are
 * rejected before the repository is called. Replacement uses the shared
 * immutable-version workflow.
 */
export function createConversionDefinitionCrudService(
  repository: CrudRepositoryPort<
    ConversionDefinition,
    CustomConversionDefinitionInput,
    CustomConversionDefinitionInput,
    ConversionDefinitionFilter
  >,
): ConversionDefinitionCrudService {
  const crud = createCrudService(repository);
  const custom: Omit<ConversionDefinitionCrudService, 'replace'> = {
    list: crud.list,
    get: crud.get,
    markForDeletion: crud.markForDeletion,
    restore: crud.restore,
    delete: crud.delete,
    create: async (request) =>
      crud.create({ ...request, input: requireCustom(request.input) }),
  };

  return createVersionedCrudService(custom, {
    toCreateInput: (input) => requireCustom(input),
  });
}

function requireCustom(
  input: CustomConversionDefinitionInput,
): CustomConversionDefinitionInput {
  if (input.origin !== 'custom') {
    throw new UnitError(
      'CONVERSION_CUSTOM_REQUIRED',
      'Custom conversion management accepts only custom definitions',
    );
  }

  return input;
}
