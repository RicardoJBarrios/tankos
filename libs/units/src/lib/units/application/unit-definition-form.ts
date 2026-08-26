import {
  FormControl,
  FormGroup,
  type AbstractControl,
  type ValidatorFn,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import type { CustomUnitDefinitionDraft } from './unit-definition-management-service';

/** Typed controls used by the custom-unit editor. */
export interface UnitDefinitionFormControls {
  readonly code: FormControl<string>;
  readonly symbol: FormControl<string>;
  readonly asciiFallback: FormControl<string>;
  readonly quantityKind: FormControl<string>;
  readonly conversionFamily: FormControl<string>;
}

export type UnitDefinitionForm = FormGroup<UnitDefinitionFormControls>;

function requiredValidator(control: AbstractControl): ValidationErrors | null {
  return Validators.required(control);
}

const REQUIRED: ValidatorFn = requiredValidator;

export const EMPTY_CUSTOM_UNIT_DRAFT: CustomUnitDefinitionDraft = {
  code: 'TANKOS:CUSTOM',
  symbol: 'u',
  asciiFallback: 'u',
  quantityKind: 'custom',
  conversionFamily: 'custom',
};

/** Creates the typed reactive form shared by applications using units. */
export function createUnitDefinitionForm(
  initial: CustomUnitDefinitionDraft = EMPTY_CUSTOM_UNIT_DRAFT,
): UnitDefinitionForm {
  return new FormGroup<UnitDefinitionFormControls>({
    code: new FormControl(initial.code, {
      nonNullable: true,
      validators: [REQUIRED],
    }),
    symbol: new FormControl(initial.symbol, {
      nonNullable: true,
      validators: [REQUIRED],
    }),
    asciiFallback: new FormControl(initial.asciiFallback, {
      nonNullable: true,
      validators: [REQUIRED],
    }),
    quantityKind: new FormControl(initial.quantityKind, {
      nonNullable: true,
      validators: [REQUIRED],
    }),
    conversionFamily: new FormControl(initial.conversionFamily, {
      nonNullable: true,
      validators: [REQUIRED],
    }),
  });
}

export function readUnitDefinitionDraft(
  form: UnitDefinitionForm,
): CustomUnitDefinitionDraft {
  return form.getRawValue();
}
