import {
  createComponentFactory,
  type Spectator,
} from '@ngneat/spectator/vitest';
import { signal } from '@angular/core';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { createEntityId, type CrudRecord } from '@tankos/data-access';
import { describe, expect, it } from 'vitest';
import { CrudListComponent } from './crud-list.component';
import { createCrudUiLabels } from './crud-ui-labels';

setupTestBed({ zoneless: false });

describe('CrudListComponent', () => {
  const createComponent = createComponentFactory({
    component: CrudListComponent,
    detectChanges: false,
  });
  const record: CrudRecord<{ name: string }> = {
    id: createEntityId('one'),
    data: { name: 'One' },
    lifecycle: { status: 'active' },
    revision: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: { kind: 'instant', epochMilliseconds: 0 },
      updatedAt: { kind: 'instant', epochMilliseconds: 0 },
    },
  };

  it('Given localized values, When creating UI labels, Then preserves strings and signals', () => {
    const labels = createCrudUiLabels({
      create: 'Crear',
      edit: signal('Editar'),
      delete: 'Eliminar',
      restore: 'Restaurar',
      loading: 'Cargando',
      error: 'No se pudieron cargar los registros',
      empty: 'Vacío',
      select: 'Seleccionar',
      actions: 'Acciones',
      loadMore: 'Cargar más',
      deleteSelected: 'Eliminar seleccionados',
    });
    expect(labels.create()).toBe('Crear');
    expect(labels.edit()).toBe('Editar');
  });

  function render(): Spectator<CrudListComponent<{ name: string }>> {
    const spectator = createComponent();
    spectator.setInput('items', [record]);
    spectator.setInput('label', (item) => item.data.name);
    spectator.detectChanges();
    return spectator;
  }

  it('Given records, When rendered, Then displays the supplied label and actions', () => {
    const spectator = render();
    expect(spectator.query('[data-testid="crud-row"]')?.textContent).toContain(
      'One',
    );
    expect(
      spectator.queryAll('button').map((button) => button.textContent.trim()),
    ).toContain('Edit');
  });

  it('Given a visible record, When delete is clicked, Then emits the record', () => {
    const spectator = render();
    let emitted: CrudRecord<{ name: string }> | undefined;
    spectator
      .output('markForDeletionRequested')
      .subscribe((value) => (emitted = value));
    spectator.click('[data-testid="mark-for-deletion"]');
    expect(emitted).toEqual(record);
  });

  it('Given selected records, When batch delete is clicked, Then emits the batch operation', () => {
    const spectator = render();
    spectator.setInput('selectedIds', [record.id]);
    spectator.detectChanges();
    let operation: string | undefined;
    spectator
      .output('batchRequested')
      .subscribe((value) => (operation = value));
    spectator.click('[data-testid="batch-mark-for-deletion"]');
    expect(operation).toBe('mark-for-deletion');
  });

  it('Given loading and an error, When rendered, Then shows their status messages', () => {
    const spectator = createComponent();
    spectator.setInput('items', []);
    spectator.setInput('loading', true);
    spectator.setInput('error', new Error('offline'));
    spectator.detectChanges();
    expect(spectator.query('[role="status"]')).toBeTruthy();
    expect(spectator.query('[role="alert"]')).toBeTruthy();
    expect(spectator.query('p')).toBeNull();
  });

  it('Given an empty ready list, When rendered, Then shows the empty state', () => {
    const spectator = createComponent();
    spectator.setInput('items', []);
    spectator.detectChanges();
    expect(spectator.query('p')?.textContent).toContain('No records');
  });

  it('Given a marked record and another page, When rendered, Then exposes restore and paging actions', () => {
    const marked = {
      ...record,
      lifecycle: { status: 'marked-for-deletion' as const },
    };
    const spectator = createComponent();
    spectator.setInput('items', [marked]);
    spectator.setInput('hasMore', true);
    spectator.detectChanges();
    let restored: CrudRecord<{ name: string }> | undefined;
    let loadMore = false;
    spectator
      .output('restoreRequested')
      .subscribe((value) => (restored = value));
    spectator.output('loadMoreRequested').subscribe(() => (loadMore = true));
    spectator.click('[data-testid="restore"]');
    spectator.click('[data-testid="load-more"]');
    expect(restored).toEqual(marked);
    expect(loadMore).toBe(true);
  });

  it('Given a record, When edit and selection change, Then emits both host actions', () => {
    const spectator = render();
    let edited: CrudRecord<{ name: string }> | undefined;
    let selected: string | undefined;
    spectator.output('editRequested').subscribe((value) => (edited = value));
    spectator
      .output('selectionToggled')
      .subscribe((value) => (selected = value));
    spectator.click('[data-testid="edit-unit"]');
    spectator.click('input[type="checkbox"]');
    expect(edited).toEqual(record);
    expect(selected).toBe(record.id);
  });

  it('Given the cards view, When rendered, Then uses the same record actions', () => {
    const spectator = render();
    spectator.setInput('view', 'cards');
    spectator.detectChanges();
    expect(spectator.query('[data-testid="crud-cards"]')).toBeTruthy();
    expect(spectator.query('[data-testid="crud-row"]')?.textContent).toContain(
      'One',
    );
  });
});
