import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  pageSizeFor,
} from '../../application/pagination';

@Component({
  selector: 'veril-pagination-controls',
  imports: [FormsModule, MatButtonModule],
  templateUrl: './pagination-controls.html',
  styleUrl: './pagination-controls.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationControls {
  readonly hasNextPage = input(false);
  readonly isLoading = input(false);
  readonly pageSize = input(DEFAULT_PAGE_SIZE);
  readonly nextPage = output<void>();
  readonly pageSizeChange = output<number>();
  readonly pageSizeOptions = [10, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE];

  changePageSize(value: string): void {
    this.pageSizeChange.emit(pageSizeFor({ pageSize: Number(value) }));
  }
}
