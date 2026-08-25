import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ListPlannedCareWork } from '../../application/list-planned-care-work';
import {
  classifyPlannedCareTiming,
  PlannedCareTiming,
} from '../../application/planned-care-timing';
import { PlannedCareWorkListItem } from '../../application/ports';
import { AquariumTimeZone } from '../../../shared/domain/aquarium-reference';
import { KEEPER_SESSION, PLANNED_CARE_WORK_READER } from '../providers';
import { formatAquariumDateTime } from '../../../shared/ui/aquarium-date-time';
import { systemClock } from '../../../shared/application/clock';

const UPCOMING_CARE_PREVIEW_LIMIT = 3;
type PreviewState = 'loading' | 'empty' | 'success' | 'failure' | 'no-context';

@Component({
  selector: 'veril-upcoming-care-preview',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './upcoming-care-preview.html',
  styleUrl: './upcoming-care-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ListPlannedCareWork,
      useFactory: () =>
        new ListPlannedCareWork(
          inject(PLANNED_CARE_WORK_READER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class UpcomingCarePreview implements OnInit {
  @Input() timeZone?: AquariumTimeZone;

  private readonly listPlannedCareWork = inject(ListPlannedCareWork);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PreviewState>('loading');
  readonly items = signal<readonly PlannedCareWorkListItem[]>([]);
  readonly errorMessage = signal('');
  readonly now = signal(systemClock.now());

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }

    void this.load();
  }

  retry(): void {
    this.state.set('loading');
    void this.load();
  }

  formatPlannedFor(item: PlannedCareWorkListItem): string {
    return formatAquariumDateTime(item.plannedFor, this.timeZone);
  }

  timing(item: PlannedCareWorkListItem): PlannedCareTiming {
    return classifyPlannedCareTiming(item.plannedFor, this.now());
  }

  timingLabel(item: PlannedCareWorkListItem): string {
    if (item.plannedFor.getTime() === this.now().getTime()) return 'Ahora';
    return this.timing(item) === 'overdue' ? 'Vencido' : 'Pendiente';
  }

  private async load(): Promise<void> {
    try {
      this.now.set(systemClock.now());
      const page = await this.listPlannedCareWork.execute(
        undefined,
        UPCOMING_CARE_PREVIEW_LIMIT,
      );
      this.items.set(page.items);
      this.state.set(page.items.length === 0 ? 'empty' : 'success');
    } catch {
      this.errorMessage.set(
        'No se han podido cargar los cuidados pendientes. Inténtalo de nuevo.',
      );
      this.state.set('failure');
    }
  }
}
