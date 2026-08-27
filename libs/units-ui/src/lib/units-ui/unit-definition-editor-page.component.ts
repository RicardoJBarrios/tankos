import { Component, effect, inject, signal, type OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { CustomUnitDefinitionDraft } from '@tankos/units';
import { UnitDefinitionFormComponent } from './unit-definition-form.component';
import { UnitDefinitionFeatureService } from './unit-definition-feature-service';

/** Create/edit page; the route decides whether the operation is a create or replacement. */
@Component({
  imports: [RouterLink, UnitDefinitionFormComponent],
  templateUrl: './unit-definition-editor-page.component.html',
})
export class UnitDefinitionEditorPageComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #service = inject(UnitDefinitionFeatureService);

  protected readonly record = this.#service.selectedRecord;
  protected readonly saveError = this.#service.saveError;
  protected readonly saveStatus = this.#service.saveStatus;
  protected readonly recordStatus = this.#service.recordStatus;
  protected readonly isEdit = this.#route.snapshot.paramMap.has('id');
  readonly #submitted = signal(false);

  public constructor() {
    effect(() => {
      if (this.#submitted() && this.saveStatus() === 'idle') {
        void this.#router.navigate(['/units'], {
          queryParamsHandling: 'preserve',
        });
      }
    });
  }

  public ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id');
    if (id) {
      this.#service.loadRecord(id);
    } else {
      this.#service.startCreate();
    }
  }

  protected save(draft: CustomUnitDefinitionDraft): void {
    this.#submitted.set(true);
    this.#service.save(draft);
  }

  protected cancel(): void {
    void this.#router.navigate(['/units'], {
      queryParamsHandling: 'preserve',
    });
  }
}
