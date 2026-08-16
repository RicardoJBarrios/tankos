import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RecordObservation } from '../../application/record-observation';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { KEEPER_SESSION, OBSERVATION_WRITER } from '../providers';
import { FormPageState } from '../../../shared/ui/page-state';

type PageState = FormPageState;

@Component({
  selector: 'veril-record-observation-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './record-observation-page.html',
  styleUrl: './record-observation-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: RecordObservation,
      useFactory: () =>
        new RecordObservation(
          inject(OBSERVATION_WRITER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class RecordObservationPage {
  private readonly recordObservation = inject(RecordObservation);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PageState>('ready');
  readonly errorMessage = signal('');
  get hasActiveContext(): boolean {
    return this.activeContext.get() !== null;
  }
  readonly form = new FormGroup({
    content: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.set('saving');
    this.errorMessage.set('');

    try {
      await this.recordObservation.execute(this.form.controls.content.value);
      this.form.reset();
      this.state.set('success');
    } catch {
      this.errorMessage.set(
        'No se ha podido guardar la observación. Inténtalo de nuevo.',
      );
      this.state.set('error');
    }
  }
}
