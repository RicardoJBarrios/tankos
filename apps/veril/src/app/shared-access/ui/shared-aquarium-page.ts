import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';

@Component({
  selector: 'veril-shared-aquarium-page',
  templateUrl: './shared-aquarium-page.html',
  styleUrl: './shared-aquarium-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedAquariumPage {
  private readonly route = inject(ActivatedRoute);
  readonly state = signal<'loading' | 'ready' | 'failure'>('loading');
  readonly aquarium = signal<{ name: string } | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const aquariumId = this.route.snapshot.paramMap.get('aquariumId');
      if (!aquariumId) throw new Error('Aquarium id is required');
      const snapshot = await getDoc(
        doc(getFirebaseClient().firestore, 'aquariums', aquariumId),
      );
      if (!snapshot.exists()) throw new Error('Aquarium not found');
      const data = snapshot.data();
      if (typeof data['name'] !== 'string') throw new Error('Invalid Aquarium');
      this.aquarium.set({ name: data['name'] });
      this.state.set('ready');
    } catch {
      this.state.set('failure');
    }
  }
}
