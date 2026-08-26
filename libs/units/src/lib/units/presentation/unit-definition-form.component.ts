import { Component, effect, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  createUnitDefinitionForm,
  EMPTY_CUSTOM_UNIT_DRAFT,
  readUnitDefinitionDraft,
} from '../application/unit-definition-form';
import type {
  CustomUnitDefinitionDraft,
  UnitDefinitionRecord,
} from '../application';

/** Reusable typed editor for custom unit definitions. */
@Component({
  selector: 'tankos-unit-definition-form',
  imports: [ReactiveFormsModule],
  templateUrl: './unit-definition-form.component.html',
})
export class UnitDefinitionFormComponent {
  public readonly record = input<UnitDefinitionRecord>();
  public readonly submitted = output<CustomUnitDefinitionDraft>();
  public readonly cancelled = output();
  protected readonly form = createUnitDefinitionForm();

  public constructor() {
    effect(() => {
      const record = this.record();
      this.form.reset(
        record
          ? {
              code: record.data.code,
              symbol: record.data.representation.symbol,
              asciiFallback: record.data.representation.asciiFallback,
              quantityKind: record.data.quantityKind,
              conversionFamily: record.data.conversionFamily,
            }
          : EMPTY_CUSTOM_UNIT_DRAFT,
      );
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(readUnitDefinitionDraft(this.form));
  }
}
