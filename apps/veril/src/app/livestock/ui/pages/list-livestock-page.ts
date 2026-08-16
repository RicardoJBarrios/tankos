import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ListLivestock } from '../../application/list-livestock';
import { RemoveLivestock } from '../../application/remove-livestock';
import { LivestockListItem } from '../../application/ports';
import {
  KEEPER_SESSION,
  LIVESTOCK_READER,
  LIVESTOCK_WRITER,
} from '../providers';
import { AsyncListPageState } from '../../../shared/ui/page-state';

type PageState = AsyncListPageState;

@Component({
  selector: 'veril-list-livestock-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './list-livestock-page.html',
  styleUrl: './list-livestock-page.css',
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
      provide: RemoveLivestock,
      useFactory: () =>
        new RemoveLivestock(
          inject(LIVESTOCK_WRITER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class ListLivestockPage implements OnInit {
  private readonly listLivestock = inject(ListLivestock);
  private readonly removeLivestock = inject(RemoveLivestock);
  private readonly context = inject(ActiveAquariumContext);
  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly LivestockListItem[]>([]);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    if (!this.context.get()) {
      this.state.set('no-context');
      return;
    }
    void this.load();
  }

  retry(): void {
    this.state.set('loading');
    void this.load();
  }

  async remove(id: string): Promise<void> {
    if (
      !globalThis.confirm(
        '¿Retirar este registro? Se conservará para trazabilidad.',
      )
    )
      return;
    try {
      await this.removeLivestock.execute(id as never);
      await this.load();
    } catch {
      this.errorMessage.set('No se ha podido retirar el registro.');
      this.state.set('failure');
    }
  }

  private async load(): Promise<void> {
    try {
      const items = await this.listLivestock.execute();
      this.items.set(items);
      this.state.set(items.length ? 'success' : 'empty');
    } catch {
      this.errorMessage.set(
        'No se ha podido cargar el livestock. Inténtalo de nuevo.',
      );
      this.state.set('failure');
    }
  }
}
