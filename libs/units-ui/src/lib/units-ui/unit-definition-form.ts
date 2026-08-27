import {
  FormControl,
  FormGroup,
  Validators,
  type AbstractControl,
  type ValidationErrors,
} from '@angular/forms';
import type {
  CustomUnitDefinitionDraft,
  UnitSymbolPosition,
  UnitSymbolSpacing,
} from '@tankos/units';

export interface UnitDefinitionFormControls {
  readonly code: FormControl<string>;
  readonly symbol: FormControl<string>;
  readonly asciiFallback: FormControl<string>;
  readonly position: FormControl<UnitSymbolPosition>;
  readonly spacing: FormControl<UnitSymbolSpacing>;
}
export type UnitDefinitionForm = FormGroup<UnitDefinitionFormControls>;
function required(control: AbstractControl): ValidationErrors | null {
  return Validators.required(control);
}
export const EMPTY_CUSTOM_UNIT_DRAFT: CustomUnitDefinitionDraft = {
  code: 'TANKOS:CUSTOM',
  symbol: 'u',
  asciiFallback: 'u',
  position: 'suffix',
  spacing: 'narrow',
};
export function createUnitDefinitionForm(
  initial: CustomUnitDefinitionDraft = EMPTY_CUSTOM_UNIT_DRAFT,
): UnitDefinitionForm {
  return new FormGroup<UnitDefinitionFormControls>({
    code: new FormControl(initial.code, {
      nonNullable: true,
      validators: [required],
    }),
    symbol: new FormControl(initial.symbol, {
      nonNullable: true,
      validators: [required],
    }),
    asciiFallback: new FormControl(initial.asciiFallback, {
      nonNullable: true,
      validators: [required],
    }),
    position: new FormControl(initial.position ?? 'suffix', {
      nonNullable: true,
    }),
    spacing: new FormControl(initial.spacing ?? 'narrow', {
      nonNullable: true,
    }),
  });
}
export function readUnitDefinitionDraft(
  form: UnitDefinitionForm,
): CustomUnitDefinitionDraft {
  return form.getRawValue();
}
