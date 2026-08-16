import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { AddLivestock } from '../../application/add-livestock';
import { KEEPER_SESSION, LIVESTOCK_WRITER } from '../providers';

@Component({
  selector: 'veril-add-livestock-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: './add-livestock-page.html',
  styleUrl: './add-livestock-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AddLivestock,
      useFactory: () =>
        new AddLivestock(
          inject(LIVESTOCK_WRITER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class AddLivestockPage {
  private readonly addLivestock = inject(AddLivestock);
  readonly displayName = signal('');
  readonly speciesProfileId = signal('');
  readonly category = signal<'fish' | 'coral' | 'other'>('fish');
  readonly representation = signal<'individual' | 'group'>('individual');
  readonly state = signal<'ready' | 'saving' | 'success' | 'failure'>('ready');
  readonly errorMessage = signal('');

  async submit(): Promise<void> {
    this.state.set('saving');
    try {
      await this.addLivestock.execute({
        speciesProfileId: this.speciesProfileId(),
        category: this.category(),
        representation: this.representation(),
        displayName: this.displayName(),
      });
      this.state.set('success');
    } catch {
      this.errorMessage.set(
        'No se ha podido guardar el registro. Revisa los datos e inténtalo de nuevo.',
      );
      this.state.set('failure');
    }
  }
}
