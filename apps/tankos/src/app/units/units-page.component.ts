import { Component, inject, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CrudMaterialTableComponent } from '@tankos/data-access-ui';
import {
  createStandardUnitCatalogue,
  UnitDefinitionFormComponent,
  type CustomUnitDefinitionDraft,
  type UnitDefinitionRecord,
} from '@tankos/units';
import { UnitDefinitionFeatureService } from '@tankos/units-ui';

@Component({
  imports: [
    CrudMaterialTableComponent,
    RouterLink,
    UnitDefinitionFormComponent,
  ],
  templateUrl: './units-page.component.html',
  styleUrl: './units-page.component.css',
})
export class UnitsPageComponent implements OnInit {
  readonly #service = inject(UnitDefinitionFeatureService);

  protected readonly standardUnits = createStandardUnitCatalogue().list();
  protected readonly list = this.#service.list;
  protected readonly editingRecord = this.#service.editingRecord;
  protected readonly saveError = this.#service.saveError;
  protected readonly saveStatus = this.#service.saveStatus;
  protected readonly lifecycleStatus = this.#service.lifecycleStatus;

  protected readonly label = this.#service.label;

  public ngOnInit(): void {
    this.#service.load();
  }

  protected save(draft: CustomUnitDefinitionDraft): void {
    this.#service.save(draft);
  }

  protected startCreate(): void {
    this.#service.startCreate();
  }

  protected edit(record: UnitDefinitionRecord): void {
    this.#service.startEdit(record);
  }

  protected cancelEdit(): void {
    this.#service.cancelEdit();
  }

  protected markForDeletion(record: UnitDefinitionRecord): void {
    this.#service.markForDeletion(record);
  }

  protected restore(record: UnitDefinitionRecord): void {
    this.#service.restore(record);
  }
}
