import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GetLivestock } from '../../application/get-livestock';
import {
  LivestockListItem,
  SpeciesProfileOption,
} from '../../application/ports';
import {
  KEEPER_SESSION,
  LIVESTOCK_READER,
  LIVESTOCK_SPECIES_PROFILE_CATALOG,
} from '../providers';

@Component({
  selector: 'veril-livestock-detail-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './livestock-detail-page.html',
  styleUrl: './livestock-detail-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: GetLivestock,
      useFactory: () =>
        new GetLivestock(inject(LIVESTOCK_READER), inject(KEEPER_SESSION)),
    },
  ],
})
export class LivestockDetailPage implements OnInit {
  private readonly getLivestock = inject(GetLivestock);
  private readonly speciesProfileCatalog = inject(
    LIVESTOCK_SPECIES_PROFILE_CATALOG,
  );
  private readonly route = inject(ActivatedRoute);
  readonly state = signal<'loading' | 'success' | 'failure'>('loading');
  readonly item = signal<LivestockListItem | null>(null);
  readonly speciesProfile = signal<SpeciesProfileOption | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.state.set('failure');
      return;
    }
    void this.load(id);
  }

  private async load(id: string): Promise<void> {
    try {
      const [item, profiles] = await Promise.all([
        this.getLivestock.execute(id),
        this.speciesProfileCatalog.listPublished(),
      ]);
      this.item.set(item);
      this.speciesProfile.set(
        profiles.find((profile) => profile.id === item.speciesProfileId) ??
          null,
      );
      this.state.set('success');
    } catch {
      this.state.set('failure');
    }
  }
}
