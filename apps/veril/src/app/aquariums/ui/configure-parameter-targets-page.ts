import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PARAMETER_IDS, ParameterId } from '../domain/measurement';
import { measurementPresentationFor } from './measurement-presentations';
import { AquariumWorkspaceStore } from './aquarium-workspace-store';

function orderedInterval(control: AbstractControl): ValidationErrors | null {
  const minimum = control.get('minimum')?.value;
  const maximum = control.get('maximum')?.value;

  return typeof minimum === 'number' &&
    typeof maximum === 'number' &&
    minimum > maximum
    ? { interval: true }
    : null;
}

@Component({
  selector: 'veril-configure-parameter-targets-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './configure-parameter-targets-page.html',
  styleUrl: './configure-parameter-targets-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigureParameterTargetsPage implements OnInit {
  readonly workspace = inject(AquariumWorkspaceStore);
  readonly parameters = PARAMETER_IDS.map(measurementPresentationFor);
  readonly editingParameter = signal<ParameterId | null>(null);
  readonly savingParameter = signal<ParameterId | null>(null);
  readonly errorMessage = signal('');
  readonly form = new FormGroup(
    {
      minimum: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0),
      ]),
      maximum: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0),
      ]),
    },
    { validators: orderedInterval },
  );

  ngOnInit(): void {
    void this.workspace.load();
  }

  targetFor(parameterId: ParameterId) {
    return this.workspace.targetFor(parameterId);
  }

  openEditor(parameterId: ParameterId): void {
    const target = this.targetFor(parameterId);
    this.errorMessage.set('');
    this.editingParameter.set(parameterId);
    this.form.setValue({
      minimum: target?.minimum ?? null,
      maximum: target?.maximum ?? null,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  closeEditor(): void {
    this.editingParameter.set(null);
    this.errorMessage.set('');
    this.form.reset({ minimum: null, maximum: null });
  }

  async save(): Promise<void> {
    const parameterId = this.editingParameter();
    if (!parameterId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const minimum = this.form.controls.minimum.value;
    const maximum = this.form.controls.maximum.value;
    if (minimum === null || maximum === null) {
      return;
    }

    this.savingParameter.set(parameterId);
    this.errorMessage.set('');
    try {
      await this.workspace.saveTarget(parameterId, minimum, maximum);
      this.closeEditor();
    } catch {
      this.errorMessage.set(
        'No se ha podido guardar el objetivo. Inténtalo de nuevo.',
      );
    } finally {
      this.savingParameter.set(null);
    }
  }

  async remove(parameterId: ParameterId): Promise<void> {
    this.savingParameter.set(parameterId);
    this.errorMessage.set('');
    try {
      await this.workspace.removeTarget(parameterId);
      if (this.editingParameter() === parameterId) {
        this.closeEditor();
      }
    } catch {
      this.errorMessage.set(
        'No se ha podido eliminar el objetivo. Inténtalo de nuevo.',
      );
    } finally {
      this.savingParameter.set(null);
    }
  }
}
