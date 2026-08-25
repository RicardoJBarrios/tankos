import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RestoreActiveAquarium } from '../../aquarium-management/application/restore-active-aquarium';
import { ReadAquariumDashboardContext } from '../../aquarium-management/application/read-aquarium-dashboard-context';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { PRIVATE_SHELL_PROVIDERS } from './private-shell.providers';
import { RecordEntrySheet } from './record-entry-sheet';
import {
  PRIVATE_PRIMARY_DESTINATIONS,
  PRIVATE_ROUTE_PRESENTATION,
  PrivateRoutePresentation,
} from './private-route-presentation';

@Component({
  selector: 'veril-private-shell',
  imports: [
    MatButtonModule,
    MatBottomSheetModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLink,
    RouterOutlet,
  ],
  providers: PRIVATE_SHELL_PROVIDERS,
  templateUrl: './private-shell.html',
  styleUrl: './private-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivateShell implements OnInit {
  @ViewChild('recordEntryTrigger')
  private recordEntryTrigger?: ElementRef<HTMLButtonElement>;

  readonly destinations = PRIVATE_PRIMARY_DESTINATIONS;
  readonly presentation = signal<PrivateRoutePresentation>(
    PRIVATE_ROUTE_PRESENTATION.aquariumList,
  );
  readonly aquariumName = signal<string | null>(null);
  readonly activeAquariumId = signal<string | null>(null);
  readonly activeDestination = computed(
    () => this.presentation().primaryDestination ?? null,
  );
  readonly canShowRecordEntry = computed(
    () =>
      Boolean(this.presentation().showRecordEntry) &&
      this.activeAquariumId() !== null,
  );

  private readonly router = inject(Router);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly destroyRef = inject(DestroyRef);
  private readonly restoreActiveAquarium = inject(RestoreActiveAquarium);
  private readonly readAquariumDashboardContext = inject(
    ReadAquariumDashboardContext,
  );
  private readonly activeContext = inject(ActiveAquariumContext);

  ngOnInit(): void {
    this.updatePresentation();
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updatePresentation();
        void this.loadActiveAquarium();
      });

    void this.restoreAndLoadActiveAquarium();
  }

  isActive(destinationId: (typeof this.destinations)[number]['id']): boolean {
    return this.activeDestination() === destinationId;
  }

  openRecordEntry(): void {
    const sheet = this.bottomSheet.open(RecordEntrySheet, {
      ariaLabel: 'Registrar',
      ariaModal: true,
    });

    sheet.afterDismissed().subscribe(() => {
      this.recordEntryTrigger?.nativeElement.focus();
    });
  }

  private updatePresentation(): void {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const presentation = route.snapshot.data['presentation'] as
      PrivateRoutePresentation | undefined;
    if (presentation) {
      this.presentation.set(presentation);
    }
  }

  private async restoreAndLoadActiveAquarium(): Promise<void> {
    // The persisted id is only an untrusted hint. The restore use case
    // validates ownership before the shell presents its name.
    await this.restoreActiveAquarium.execute();
    await this.loadActiveAquarium();
  }

  private async loadActiveAquarium(): Promise<void> {
    const aquariumId = this.activeContext.get();
    this.activeAquariumId.set(aquariumId);
    this.aquariumName.set(null);

    if (!aquariumId) {
      return;
    }

    try {
      const aquarium = await this.readAquariumDashboardContext.execute();
      if (this.activeContext.get() === aquariumId) {
        this.aquariumName.set(aquarium.name.value);
      }
    } catch {
      // The page remains responsible for presenting any context read error.
      // The shell only avoids presenting an unverified or stale name.
    }
  }
}
