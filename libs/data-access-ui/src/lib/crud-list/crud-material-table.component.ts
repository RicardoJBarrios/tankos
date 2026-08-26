import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import type { CrudRecord, EntityId } from '@tankos/data-access';
import type {
  CrudListBatchOperation,
  CrudListColumn,
} from './crud-list.component';

/** Material table renderer for a generic CRUD collection. */
@Component({
  selector: 'tankos-crud-material-table',
  standalone: true,
  imports: [MatButtonModule, MatCheckboxModule, MatTableModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crud-material-table.component.html',
})
export class CrudMaterialTableComponent<TData> {
  public readonly items = input.required<readonly CrudRecord<TData>[]>();
  public readonly loading = input(false);
  public readonly error = input<unknown>(undefined);
  public readonly hasMore = input(false);
  public readonly selectedIds = input<readonly EntityId[]>([]);
  public readonly label = input<(item: CrudRecord<TData>) => string>(
    (item) => item.id,
  );
  public readonly columns = input<readonly CrudListColumn<TData>[]>([]);
  public readonly createRequested = output();
  public readonly editRequested = output<CrudRecord<TData>>();
  public readonly markForDeletionRequested = output<CrudRecord<TData>>();
  public readonly restoreRequested = output<CrudRecord<TData>>();
  public readonly selectionToggled = output<EntityId>();
  public readonly loadMoreRequested = output();
  public readonly batchRequested = output<CrudListBatchOperation>();

  public displayedColumns(): readonly string[] {
    return [
      'select',
      ...this.columns().map((column) => column.id),
      'record',
      'actions',
    ];
  }

  public isEmpty(): boolean {
    return this.items().length === 0 && !this.loading() && !this.error();
  }
}
