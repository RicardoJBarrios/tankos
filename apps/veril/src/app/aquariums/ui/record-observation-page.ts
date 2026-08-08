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
import { RecordObservation } from '../application/record-observation';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { KEEPER_SESSION, OBSERVATION_WRITER } from './aquarium-providers';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreObservationRepository } from '../infrastructure/firestore-observation-repository';

type PageState = 'ready' | 'saving' | 'success' | 'error';

@Component({
  selector: 'veril-record-observation-page',
  imports: [ReactiveFormsModule],
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
    {
      provide: OBSERVATION_WRITER,
      useClass: FirestoreObservationRepository,
    },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
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
