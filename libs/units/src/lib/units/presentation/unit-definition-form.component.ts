import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
} from '@angular/core';
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
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form
      data-testid="unit-definition-form"
      [formGroup]="form"
      (ngSubmit)="submit()"
    >
      <label
        >Code
        <input
          data-testid="unit-code"
          formControlName="code"
          [readOnly]="record() !== undefined"
      /></label>
      <label
        >Symbol <input data-testid="unit-symbol" formControlName="symbol"
      /></label>
      <label
        >ASCII fallback
        <input
          data-testid="unit-ascii-fallback"
          formControlName="asciiFallback"
      /></label>
      <label
        >Quantity kind
        <input data-testid="unit-quantity-kind" formControlName="quantityKind"
      /></label>
      <label
        >Conversion family
        <input
          data-testid="unit-conversion-family"
          formControlName="conversionFamily"
      /></label>
      <button data-testid="save-unit" type="submit">
        {{ record() ? 'Update' : 'Save' }}
      </button>
      @if (record()) {
        <button
          data-testid="cancel-unit"
          type="button"
          (click)="cancelled.emit()"
        >
          Cancel
        </button>
      }
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
