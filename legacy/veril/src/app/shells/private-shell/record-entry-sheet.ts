import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

export const RECORD_ENTRY_OPTIONS = [
  {
    id: 'observation',
    label: 'Observación',
    description: 'Anota algo que hayas observado en el acuario.',
    route: '/app/aquariums/observations/new',
  },
  {
    id: 'measurement',
    label: 'Medición',
    description: 'Registra un valor de un parámetro del agua.',
    route: '/app/aquariums/measurements/new',
  },
  {
    id: 'care',
    label: 'Cuidado realizado',
    description: 'Deja constancia de una tarea que ya has hecho.',
    route: '/app/aquariums/care/new',
  },
  {
    id: 'water-change',
    label: 'Cambio de agua',
    description: 'Registra un cambio de agua completado.',
    route: '/app/aquariums/maintenance/new',
  },
] as const;

@Component({
  selector: 'veril-record-entry-sheet',
  imports: [MatButtonModule],
  templateUrl: './record-entry-sheet.html',
  styleUrl: './record-entry-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordEntrySheet {
  readonly options = RECORD_ENTRY_OPTIONS;

  private readonly bottomSheetRef = inject(MatBottomSheetRef<RecordEntrySheet>);
  private readonly router = inject(Router);

  choose(route: string): void {
    this.bottomSheetRef.dismiss();
    void this.router.navigateByUrl(route);
  }
}
