import { Component, effect, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import type {
  CustomUnitDefinitionDraft,
  UnitDefinitionRecord,
} from '@tankos/units';
import { formatUnitValue } from '@tankos/formatting';
import {
  createUnitDefinitionForm,
  EMPTY_CUSTOM_UNIT_DRAFT,
  readUnitDefinitionDraft,
} from './unit-definition-form';
@Component({
  selector: 'lib-unit-definition-form',
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
              position: record.data.representation.position,
              spacing: record.data.representation.spacing,
            }
          : EMPTY_CUSTOM_UNIT_DRAFT,
      );
    });
  }
  protected displayPreview(): string {
    return formatUnitValue(12, {
      symbol: this.form.controls.symbol.value.trim() || 'unit',
      position: this.form.controls.position.value,
      spacing: this.form.controls.spacing.value,
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
