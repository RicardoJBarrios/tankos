import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import type { CrudRecord, EntityId } from '@tank-os/data-access';

/** Batch operation that a neutral CRUD list can request from its host. */
export type CrudListBatchOperation = 'update' | 'mark-for-deletion' | 'delete';

/** Headless-friendly CRUD list surface with standard lifecycle actions. */
@Component({
  selector: 'tankos-crud-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-label="CRUD list">
      <button type="button" data-testid="create" (click)="createRequested.emit()">Create</button>
      @if (loading()) { <span role="status">Loading</span> }
      @if (error()) { <span role="alert">Unable to load records</span> }
      @if (isEmpty()) { <p>No records</p> }
      <ul>
        @for (item of items(); track item.id) {
          <li>
            <input
              type="checkbox"
              [checked]="selectedIds().includes(item.id)"
              (change)="selectionToggled.emit(item.id)"
              [attr.aria-label]="'Select ' + label()(item)"
            />
            <span>{{ label()(item) }}</span>
            <button type="button" (click)="editRequested.emit(item)">Edit</button>
            @if (item.lifecycle.status === 'marked-for-deletion') {
              <button type="button" (click)="restoreRequested.emit(item)">Restore</button>
            } @else {
              <button type="button" data-testid="mark-for-deletion" (click)="markForDeletionRequested.emit(item)">Delete</button>
            }
          </li>
        }
      </ul>
      @if (hasMore()) {
        <button type="button" data-testid="load-more" (click)="loadMoreRequested.emit()">Load more</button>
      }
      @if (selectedIds().length > 0) {
        <button type="button" data-testid="batch-mark-for-deletion" (click)="batchRequested.emit('mark-for-deletion')">Delete selected</button>
      }
    </section>
  `,
})
export class CrudListComponent<TData> {
  /** Records currently visible in the list. */
  readonly items = input.required<readonly CrudRecord<TData>[]>();
  /** Whether the host is loading a page. */
  readonly loading = input(false);
  /** Whether the host has a recoverable loading error. */
  readonly error = input<unknown>(undefined);
  /** Whether another page can be requested. */
  readonly hasMore = input(false);
  /** Selected record identifiers controlled by the host store. */
  readonly selectedIds = input<readonly EntityId[]>([]);
  /** Domain-specific display label supplied by the host. */
  readonly label = input<(item: CrudRecord<TData>) => string>((item) => item.id);
  /** Emitted when the host should start creation. */
  readonly createRequested = output<void>();
  /** Emitted when the host should start editing. */
  readonly editRequested = output<CrudRecord<TData>>();
  /** Emitted when a record should be logically deleted. */
  readonly markForDeletionRequested = output<CrudRecord<TData>>();
  /** Emitted when a record should be restored. */
  readonly restoreRequested = output<CrudRecord<TData>>();
  /** Emitted when selection changes. */
  readonly selectionToggled = output<EntityId>();
  /** Emitted when another page is requested. */
  readonly loadMoreRequested = output<void>();
  /** Emitted when the host should open batch confirmation. */
  readonly batchRequested = output<CrudListBatchOperation>();

  /** Whether the list has no records and is not currently loading. */
  isEmpty(): boolean {
    return this.items().length === 0 && !this.loading() && !this.error();
  }
}
