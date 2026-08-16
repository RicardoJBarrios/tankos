import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
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
import { AquariumOption, SpeciesProfileOption } from '../../application/ports';
import {
  KEEPER_SESSION,
  LIVESTOCK_AQUARIUM_CATALOG,
  LIVESTOCK_SPECIES_PROFILE_CATALOG,
  LIVESTOCK_WRITER,
} from '../providers';

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
export class AddLivestockPage implements OnInit {
  private readonly addLivestock = inject(AddLivestock);
  private readonly keeperSession = inject(KEEPER_SESSION);
  private readonly speciesCatalog = inject(LIVESTOCK_SPECIES_PROFILE_CATALOG);
  private readonly aquariumCatalog = inject(LIVESTOCK_AQUARIUM_CATALOG);
  readonly displayName = signal('');
  readonly speciesProfileId = signal('');
  readonly category = signal<'fish' | 'coral' | 'other'>('fish');
  readonly representation = signal<'individual' | 'group'>('individual');
  readonly state = signal<'ready' | 'saving' | 'success' | 'failure'>('ready');
  readonly errorMessage = signal('');
  readonly profiles = signal<readonly SpeciesProfileOption[]>([]);
  readonly aquariums = signal<readonly AquariumOption[]>([]);
  readonly loadingOptions = signal(true);

  ngOnInit(): void {
    void this.loadOptions();
  }

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

  private async loadOptions(): Promise<void> {
    try {
      const keeper = await this.keeperSession.requireAuthenticatedKeeper();
      const [profiles, aquariums] = await Promise.all([
        this.speciesCatalog.listPublished(),
        this.aquariumCatalog.listOwned(keeper.id),
      ]);
      this.profiles.set(profiles);
      this.aquariums.set(aquariums);
      if (!this.speciesProfileId() && profiles[0]) {
        this.speciesProfileId.set(profiles[0].id);
      }
    } catch {
      this.errorMessage.set('No se han podido cargar los perfiles de especie.');
      this.state.set('failure');
    } finally {
      this.loadingOptions.set(false);
    }
  }
}
