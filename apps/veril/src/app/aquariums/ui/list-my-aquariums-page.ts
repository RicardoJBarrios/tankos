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
import { AquariumListItem } from '../application/aquarium-ports';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { ListMyAquariums } from '../application/list-my-aquariums';
import { SelectAquarium } from '../application/select-aquarium';
import { AQUARIUM_REPOSITORY, KEEPER_SESSION } from './aquarium-providers';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreAquariumRepository } from '../infrastructure/firestore-aquarium-repository';

type ListState = 'loading' | 'empty' | 'success' | 'failure';

@Component({
  selector: 'veril-list-my-aquariums-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './list-my-aquariums-page.html',
  styleUrl: './list-my-aquariums-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ListMyAquariums,
      useFactory: () =>
        new ListMyAquariums(
          inject(AQUARIUM_REPOSITORY),
          inject(KEEPER_SESSION),
        ),
    },
    {
      provide: SelectAquarium,
      useFactory: () =>
        new SelectAquarium(
          inject(AQUARIUM_REPOSITORY),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    { provide: AQUARIUM_REPOSITORY, useClass: FirestoreAquariumRepository },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
  ],
})
export class ListMyAquariumsPage implements OnInit {
  private readonly listMyAquariums = inject(ListMyAquariums);
  private readonly selectAquarium = inject(SelectAquarium);
  readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<ListState>('loading');
  readonly aquariums = signal<readonly AquariumListItem[]>([]);
  readonly selectionState = signal<'idle' | 'loading' | 'failure'>('idle');

  ngOnInit(): void {
    void this.loadAquariums();
  }

  async select(aquarium: AquariumListItem): Promise<void> {
    if (this.activeContext.get() === aquarium.id) {
      return;
    }

    this.selectionState.set('loading');

    try {
      await this.selectAquarium.execute(aquarium.id);
      this.selectionState.set('idle');
    } catch {
      this.selectionState.set('failure');
    }
  }

  retry(): void {
    this.state.set('loading');
    void this.loadAquariums();
  }

  private async loadAquariums(): Promise<void> {
    try {
      const aquariums = await this.listMyAquariums.execute();
      this.aquariums.set(aquariums);
      this.state.set(aquariums.length === 0 ? 'empty' : 'success');
    } catch {
      this.state.set('failure');
    }
  }
}
