import { Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatPaginatorModule,
  type PageEvent,
} from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import type { CrudRecord, EntityId } from '@tankos/data-access';
import type {
  CrudListBatchOperation,
  CrudListColumn,
} from '@tankos/data-access-ui';
import { CRUD_UI_LABELS } from '@tankos/data-access-ui';

const DEFAULT_PAGE_SIZE = 10;

export function crudMaterialDisplayedColumns<TData>(
  selectable: boolean,
  columns: readonly CrudListColumn<TData>[],
): readonly string[] {
  return [
    ...(selectable ? ['select'] : []),
    ...columns.map((column) => column.id),
    'record',
    'actions',
  ];
}

/** Material table renderer for the provider-neutral CRUD list contract. */
@Component({
  selector: 'tankos-crud-material-table',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatTableModule,
  ],
  templateUrl: './crud-material-table.component.html',
})
export class CrudMaterialTableComponent<TData> {
  public readonly items = input.required<readonly CrudRecord<TData>[]>();
  public readonly loading = input(false);
  public readonly error = input<unknown>(undefined);
  public readonly disabled = input(false);
  public readonly hasMore = input(false);
  public readonly pageIndex = input(0);
  public readonly pageSize = input(DEFAULT_PAGE_SIZE);
  public readonly selectedIds = input<readonly EntityId[]>([]);
  public readonly selectable = input(true);
  public readonly canCreate = input(true);
  public readonly label = input<(item: CrudRecord<TData>) => string>(
    (item) => item.id,
  );
  public readonly columns = input<readonly CrudListColumn<TData>[]>([]);
  public readonly canEdit = input<(item: CrudRecord<TData>) => boolean>(
    () => true,
  );
  public readonly canMarkForDeletion = input<
    (item: CrudRecord<TData>) => boolean
  >(() => true);
  public readonly canPublish = input<(item: CrudRecord<TData>) => boolean>(
    () => false,
  );
  public readonly canPhysicallyDelete = input<
    (item: CrudRecord<TData>) => boolean
  >(() => false);
  public readonly createRequested = output();
  public readonly editRequested = output<CrudRecord<TData>>();
  public readonly detailRequested = output<CrudRecord<TData>>();
  public readonly markForDeletionRequested = output<CrudRecord<TData>>();
  public readonly restoreRequested = output<CrudRecord<TData>>();
  public readonly publishRequested = output<CrudRecord<TData>>();
  public readonly physicalDeleteRequested = output<CrudRecord<TData>>();
  public readonly selectionToggled = output<EntityId>();
  public readonly loadMoreRequested = output();
  public readonly pageRequested = output<number>();
  public readonly batchRequested = output<CrudListBatchOperation>();
  protected readonly labels = inject(CRUD_UI_LABELS);
  protected readonly visibleItems = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.items().slice(start, start + this.pageSize());
  });

  public displayedColumns(): readonly string[] {
    return crudMaterialDisplayedColumns(this.selectable(), this.columns());
  }

  public isEmpty(): boolean {
    return this.items().length === 0 && !this.loading() && !this.error();
  }
  protected pageChanged(event: PageEvent): void {
    this.pageRequested.emit(event.pageIndex);
  }
}
