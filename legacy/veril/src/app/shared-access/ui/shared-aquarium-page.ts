import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import {
  AquariumAccessPermission,
  AquariumAccessService,
  SharedAquariumView,
} from '../application/ports';
import { AQUARIUM_ACCESS_SERVICE } from './providers';

@Component({
  selector: 'veril-shared-aquarium-page',
  imports: [RouterLink],
  templateUrl: './shared-aquarium-page.html',
  styleUrl: './shared-aquarium-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedAquariumPage {
  readonly route = inject(ActivatedRoute);
  readonly state = signal<'loading' | 'ready' | 'failure'>('loading');
  readonly aquarium = signal<SharedAquariumView | null>(null);
  readonly sectionKeys = [
    'aquarium',
    'measurements',
    'observations',
    'careWorks',
    'plannedCareWorks',
    'recurringCarePlans',
    'livestock',
    'equipment',
    'waterChanges',
  ] as const;
  private readonly service = inject<AquariumAccessService>(
    AQUARIUM_ACCESS_SERVICE,
  );

  constructor() {
    void this.load();
  }

  sectionCount(
    view: SharedAquariumView,
    section: AquariumAccessPermission,
  ): number | undefined {
    return view.sections[section];
  }

  sectionLabel(section: AquariumAccessPermission): string {
    return {
      aquarium: 'Acuario',
      measurements: 'Mediciones',
      observations: 'Observaciones',
      careWorks: 'Cuidados realizados',
      plannedCareWorks: 'Cuidados planificados',
      recurringCarePlans: 'Planes recurrentes',
      livestock: 'Habitantes',
      equipment: 'Equipos',
      waterChanges: 'Cambios de agua',
    }[section];
  }

  private async load(): Promise<void> {
    try {
      const aquariumId = this.route.snapshot.paramMap.get('aquariumId');
      if (!aquariumId) throw new Error('Aquarium id is required');
      this.aquarium.set(await this.service.readSharedAquarium({ aquariumId }));
      this.state.set('ready');
    } catch {
      this.state.set('failure');
    }
  }
}
