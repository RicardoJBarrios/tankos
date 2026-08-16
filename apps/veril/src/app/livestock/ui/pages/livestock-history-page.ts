import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ListLivestockHistory } from '../../application/list-livestock-history';
import { LivestockListItem } from '../../application/ports';
import { KEEPER_SESSION, LIVESTOCK_READER } from '../providers';

@Component({
  selector: 'veril-livestock-history-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './livestock-history-page.html',
  styleUrl: './livestock-history-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ListLivestockHistory,
      useFactory: () =>
        new ListLivestockHistory(
          inject(LIVESTOCK_READER),
          inject(KEEPER_SESSION),
        ),
    },
  ],
})
export class LivestockHistoryPage implements OnInit {
  private readonly listHistory = inject(ListLivestockHistory);
  readonly state = signal<'loading' | 'success' | 'empty' | 'failure'>(
    'loading',
  );
  readonly items = signal<readonly LivestockListItem[]>([]);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const items = await this.listHistory.execute();
      this.items.set(items);
      this.state.set(items.length ? 'success' : 'empty');
    } catch {
      this.state.set('failure');
    }
  }
}
