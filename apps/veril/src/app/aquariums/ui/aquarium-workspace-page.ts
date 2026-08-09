import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { ListMyAquariums } from '../application/list-my-aquariums';
import { AQUARIUM_REPOSITORY, KEEPER_SESSION } from './aquarium-providers';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreAquariumRepository } from '../infrastructure/firestore-aquarium-repository';
import { CurrentMeasurementsSection } from './current-measurements-section';

type WorkspaceState = 'loading' | 'ready' | 'no-context' | 'failure';

@Component({
  selector: 'veril-aquarium-workspace-page',
  imports: [
    CurrentMeasurementsSection,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './aquarium-workspace-page.html',
  styleUrl: './aquarium-workspace-page.css',
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
export class AquariumWorkspacePage implements OnInit {
  private readonly listMyAquariums = inject(ListMyAquariums);
  readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<WorkspaceState>('loading');
  readonly aquariumName = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }

    void this.loadAquarium();
  }

  private async loadAquarium(): Promise<void> {
    try {
      const activeAquariumId = this.activeContext.get();
      if (!activeAquariumId) {
        this.state.set('no-context');
        return;
      }

      const aquariums = await this.listMyAquariums.execute();
      const aquarium = aquariums.find(({ id }) => id === activeAquariumId);
      if (!aquarium) {
        this.state.set('failure');
        return;
      }

      this.aquariumName.set(aquarium.name.value);
      this.state.set('ready');
    } catch {
      this.state.set('failure');
    }
  }
}
