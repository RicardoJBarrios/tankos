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
import { LivestockListItem } from '../../application/ports';
import { KEEPER_SESSION, LIVESTOCK_READER } from '../providers';

type PageState = 'loading' | 'empty' | 'success' | 'failure' | 'no-context';

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
  ],
})
export class ListLivestockPage implements OnInit {
  private readonly listLivestock = inject(ListLivestock);
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
