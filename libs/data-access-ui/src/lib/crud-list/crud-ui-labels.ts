import { InjectionToken, signal, type Signal } from '@angular/core';

/** Localizable static and accessibility text used by CRUD renderers. */
export interface CrudUiLabels {
  readonly create: Signal<string>;
  readonly edit: Signal<string>;
  readonly delete: Signal<string>;
  readonly restore: Signal<string>;
  readonly loading: Signal<string>;
  readonly error: Signal<string>;
  readonly empty: Signal<string>;
  readonly select: Signal<string>;
  readonly actions: Signal<string>;
  readonly loadMore: Signal<string>;
  readonly deleteSelected: Signal<string>;
}

/** Creates an autonomous English fallback for consumers without i18n setup. */
export function createDefaultCrudUiLabels(): CrudUiLabels {
  return createCrudUiLabels({
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    restore: 'Restore',
    loading: 'Loading',
    error: 'Unable to load records',
    empty: 'No records',
    select: 'Select',
    actions: 'Actions',
    loadMore: 'Load more',
    deleteSelected: 'Delete selected',
  });
}

/** Builds labels from any i18n adapter, including runtime translation signals. */
export function createCrudUiLabels(
  values: Record<keyof CrudUiLabels, string | Signal<string>>,
): CrudUiLabels {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === 'string' ? signal(value) : value,
    ]),
  ) as unknown as CrudUiLabels;
}

export const CRUD_UI_LABELS = new InjectionToken<CrudUiLabels>(
  'CRUD_UI_LABELS',
  { providedIn: 'root', factory: createDefaultCrudUiLabels },
);
