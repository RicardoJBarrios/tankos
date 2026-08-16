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
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { aquariumIdFrom } from '../../../shared/domain/aquarium-reference';
import { TransferLivestock } from '../../application/transfer-livestock';
import { ListLivestock } from '../../application/list-livestock';
import { AquariumOption, LivestockListItem } from '../../application/ports';
import { livestockIdFrom } from '../../domain/livestock';
import {
  KEEPER_SESSION,
  LIVESTOCK_AQUARIUM_CATALOG,
  LIVESTOCK_READER,
  LIVESTOCK_WRITER,
} from '../providers';

@Component({
  selector: 'veril-transfer-livestock-page',
  imports: [FormsModule, MatButtonModule, MatCardModule, RouterLink],
  templateUrl: './transfer-livestock-page.html',
  styleUrl: './transfer-livestock-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ListLivestock,
      useFactory: () =>
        new ListLivestock(
          inject(LIVESTOCK_READER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: TransferLivestock,
      useFactory: () =>
        new TransferLivestock(
          inject(LIVESTOCK_WRITER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class TransferLivestockPage implements OnInit {
  private readonly listLivestock = inject(ListLivestock);
  private readonly transferLivestock = inject(TransferLivestock);
  private readonly keeperSession = inject(KEEPER_SESSION);
  private readonly aquariumCatalog = inject(LIVESTOCK_AQUARIUM_CATALOG);
  private readonly context = inject(ActiveAquariumContext);
  readonly items = signal<readonly LivestockListItem[]>([]);
  readonly aquariums = signal<readonly AquariumOption[]>([]);
  readonly livestockId = signal('');
  readonly aquariumId = signal('');
  readonly state = signal<
    'loading' | 'ready' | 'saving' | 'success' | 'failure'
  >('loading');
  readonly errorMessage = signal('');

  ngOnInit(): void {
    void this.load();
  }

  async submit(): Promise<void> {
    this.state.set('saving');
    try {
      await this.transferLivestock.execute(
        livestockIdFrom(this.livestockId()),
        aquariumIdFrom(this.aquariumId()),
      );
      this.state.set('success');
    } catch {
      this.errorMessage.set('No se ha podido transferir el registro.');
      this.state.set('failure');
    }
  }

  private async load(): Promise<void> {
    try {
      const keeper = await this.keeperSession.requireAuthenticatedKeeper();
      const current = this.context.get();
      if (!current) throw new Error('Aquarium context is required');
      const [items, aquariums] = await Promise.all([
        this.listLivestock.execute(),
        this.aquariumCatalog.listOwned(keeper.id),
      ]);
      this.items.set(items);
      this.aquariums.set(
        aquariums.filter((aquarium) => aquarium.id !== current),
      );
      this.livestockId.set(items[0]?.id ?? '');
      this.aquariumId.set(
        aquariums.find((aquarium) => aquarium.id !== current)?.id ?? '',
      );
      this.state.set('ready');
    } catch {
      this.errorMessage.set(
        'No se han podido cargar los registros y acuarios.',
      );
      this.state.set('failure');
    }
  }
}
