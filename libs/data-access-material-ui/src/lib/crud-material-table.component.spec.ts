import { describe, expect, it } from 'vitest';
import { crudMaterialDisplayedColumns } from './crud-material-table.component';

describe('CrudMaterialTableComponent', () => {
  it('exposes semantic columns and actions through the Material renderer', () => {
    expect(crudMaterialDisplayedColumns(true, [])).toEqual([
      'select',
      'record',
      'actions',
    ]);
  });
});
