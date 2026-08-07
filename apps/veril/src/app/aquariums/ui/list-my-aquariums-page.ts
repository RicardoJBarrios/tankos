import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { AquariumListItem } from '../application/aquarium-ports';
import { ListMyAquariums } from '../application/list-my-aquariums';
import { AQUARIUM_REPOSITORY, KEEPER_SESSION } from './aquarium-providers';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreAquariumRepository } from '../infrastructure/firestore-aquarium-repository';

type ListState = 'loading' | 'empty' | 'success' | 'failure';

@Component({
  selector: 'veril-list-my-aquariums-page',
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
    { provide: AQUARIUM_REPOSITORY, useClass: FirestoreAquariumRepository },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
  ],
})
export class ListMyAquariumsPage implements OnInit {
  private readonly listMyAquariums = inject(ListMyAquariums);

  readonly state = signal<ListState>('loading');
  readonly aquariums = signal<readonly AquariumListItem[]>([]);

  ngOnInit(): void {
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
