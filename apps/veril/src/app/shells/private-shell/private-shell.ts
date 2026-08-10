import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ActiveAquariumContext } from '../../aquariums/application/active-aquarium-context';
import { RestoreActiveAquarium } from '../../aquariums/application/restore-active-aquarium';
import { ReadAquariumDashboardContext } from '../../aquariums/application/read-aquarium-dashboard-context';
import { RemoveParameterTarget } from '../../aquariums/application/remove-parameter-target';
import { SaveParameterTarget } from '../../aquariums/application/save-parameter-target';
import { FirebaseKeeperSession } from '../../aquariums/infrastructure/firebase-keeper-session';
import { FirestoreAquariumRepository } from '../../aquariums/infrastructure/firestore-aquarium-repository';
import { SessionStorageActiveAquariumContextStorage } from '../../aquariums/infrastructure/session-storage-active-aquarium-context-storage';
import {
  ACTIVE_AQUARIUM_CONTEXT_STORAGE,
  AQUARIUM_DASHBOARD_READER,
  AQUARIUM_REPOSITORY,
  KEEPER_SESSION,
  PARAMETER_TARGET_WRITER,
} from '../../aquariums/ui/aquarium-providers';
import { AquariumWorkspaceStore } from '../../aquariums/ui/aquarium-workspace-store';

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
    {
      provide: AQUARIUM_DASHBOARD_READER,
      useClass: FirestoreAquariumRepository,
    },
    {
      provide: PARAMETER_TARGET_WRITER,
      useClass: FirestoreAquariumRepository,
    },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
    {
      provide: ReadAquariumDashboardContext,
      useFactory: () =>
        new ReadAquariumDashboardContext(
          inject(AQUARIUM_DASHBOARD_READER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: SaveParameterTarget,
      useFactory: () =>
        new SaveParameterTarget(
          inject(PARAMETER_TARGET_WRITER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: RemoveParameterTarget,
      useFactory: () =>
        new RemoveParameterTarget(
          inject(PARAMETER_TARGET_WRITER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
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
    AquariumWorkspaceStore,
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
