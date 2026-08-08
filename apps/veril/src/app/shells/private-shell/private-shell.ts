import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ActiveAquariumContext } from '../../aquariums/application/active-aquarium-context';
import { RestoreActiveAquarium } from '../../aquariums/application/restore-active-aquarium';
import { FirebaseKeeperSession } from '../../aquariums/infrastructure/firebase-keeper-session';
import { FirestoreAquariumRepository } from '../../aquariums/infrastructure/firestore-aquarium-repository';
import { SessionStorageActiveAquariumContextStorage } from '../../aquariums/infrastructure/session-storage-active-aquarium-context-storage';
import {
  ACTIVE_AQUARIUM_CONTEXT_STORAGE,
  AQUARIUM_REPOSITORY,
  KEEPER_SESSION,
} from '../../aquariums/ui/aquarium-providers';

@Component({
  selector: 'veril-private-shell',
  imports: [
    MatButtonModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    RouterLink,
    RouterOutlet,
  ],
  providers: [
    {
      provide: ACTIVE_AQUARIUM_CONTEXT_STORAGE,
      useClass: SessionStorageActiveAquariumContextStorage,
    },
    {
      provide: ActiveAquariumContext,
      useFactory: () =>
        new ActiveAquariumContext(inject(ACTIVE_AQUARIUM_CONTEXT_STORAGE)),
    },
    { provide: AQUARIUM_REPOSITORY, useClass: FirestoreAquariumRepository },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
    {
      provide: RestoreActiveAquarium,
      useFactory: () =>
        new RestoreActiveAquarium(
          inject(AQUARIUM_REPOSITORY),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
          inject(ACTIVE_AQUARIUM_CONTEXT_STORAGE),
        ),
    },
  ],
  templateUrl: './private-shell.html',
  styleUrl: './private-shell.css',
})
export class PrivateShell implements OnInit {
  private readonly restoreActiveAquarium = inject(RestoreActiveAquarium);

  readonly isRestoring = signal(true);

  async ngOnInit(): Promise<void> {
    await this.restoreActiveAquarium.execute();
    this.isRestoring.set(false);
  }
}
