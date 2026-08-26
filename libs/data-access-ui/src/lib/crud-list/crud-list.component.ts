import { Component, inject, input, output } from '@angular/core';
import type { CrudRecord, EntityId } from '@tankos/data-access';
import { CRUD_UI_LABELS } from './crud-ui-labels';

/** Batch operation that a neutral CRUD list can request from its host. */
export type CrudListBatchOperation = 'update' | 'mark-for-deletion' | 'delete';

/** Presentation selected by a CRUD shell without changing its data source. */
export type CrudListView = 'table' | 'cards';

/** Declarative column definition for the Material table presentation. */
export interface CrudListColumn<TData> {
  readonly id: string;
  readonly header: string;
  readonly value: (item: CrudRecord<TData>) => string;
}

/** Headless-friendly CRUD list surface with standard lifecycle actions. */
@Component({
  selector: 'tankos-crud-list',
  templateUrl: './crud-list.component.html',
})
export class CrudListComponent<TData> {
  /** Rendering strategy; table is the default for data-dense CRUD screens. */
  public readonly view = input<CrudListView>('table');
  /** Records currently visible in the list. */
  public readonly items = input.required<readonly CrudRecord<TData>[]>();
  /** Whether the host is loading a page. */
  public readonly loading = input(false);
  /** Whether the host has a recoverable loading error. */
  public readonly error = input<unknown>(undefined);
  /** Whether another page can be requested. */
  public readonly hasMore = input(false);
  /** Selected record identifiers controlled by the host store. */
  public readonly selectedIds = input<readonly EntityId[]>([]);
  /** Domain-specific display label supplied by the host. */
  public readonly label = input<(item: CrudRecord<TData>) => string>(
    (item) => item.id,
  );
  /** Columns rendered by the table view. */
  public readonly columns = input<readonly CrudListColumn<TData>[]>([]);
  /** Emitted when the host should start creation. */
  public readonly createRequested = output();
  /** Emitted when the host should start editing. */
  public readonly editRequested = output<CrudRecord<TData>>();
  /** Emitted when a record should be logically deleted. */
  public readonly markForDeletionRequested = output<CrudRecord<TData>>();
  /** Emitted when a record should be restored. */
  public readonly restoreRequested = output<CrudRecord<TData>>();
  /** Emitted when selection changes. */
  public readonly selectionToggled = output<EntityId>();
  /** Emitted when another page is requested. */
  public readonly loadMoreRequested = output();
  /** Emitted when the host should open batch confirmation. */
  public readonly batchRequested = output<CrudListBatchOperation>();
  protected readonly labels = inject(CRUD_UI_LABELS);

  /** Whether the list has no records and is not currently loading. */
  public isEmpty(): boolean {
    return this.items().length === 0 && !this.loading() && !this.error();
  }
}
