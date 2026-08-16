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
import { EstablishAquarium } from '../../application/establish-aquarium';
import { AQUARIUM_REPOSITORY, KEEPER_SESSION } from '../providers';

type PageState = 'ready' | 'saving' | 'success' | 'error';

@Component({
  selector: 'veril-establish-aquarium-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './establish-aquarium-page.html',
  styleUrl: './establish-aquarium-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: EstablishAquarium,
      useFactory: () =>
        new EstablishAquarium(
          inject(AQUARIUM_REPOSITORY),
          inject(KEEPER_SESSION),
        ),
    },
  ],
})
export class EstablishAquariumPage {
  private readonly establishAquarium = inject(EstablishAquarium);

  readonly state = signal<PageState>('ready');
  readonly errorMessage = signal('');
  readonly aquariumName = signal('');
  readonly form = new FormGroup({
    name: new FormControl('', {
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
      const aquarium = await this.establishAquarium.execute(
        this.form.controls.name.value,
      );
      this.aquariumName.set(aquarium.name.value);
      this.state.set('success');
    } catch {
      this.errorMessage.set(
        'No se ha podido crear el acuario. Inténtalo de nuevo.',
      );
      this.state.set('error');
    }
  }
}
